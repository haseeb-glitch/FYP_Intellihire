import json
import os
import asyncio
import random
import time
from datetime import datetime
from backend import db
from backend.models.interview import InterviewSession, SessionQuestion, QuestionBank, CompanyQuestionBank
from backend.models.report import EvaluationScore
from backend.agents.agents import company_agent, coordinator_agent, scraper_agent
from backend.agents.scoring import final_score, rubric_engine
from backend.agents.nlp import feedback_generator
from backend.agents.orchestration import adaptive_difficulty

# In-memory cache for company info to avoid redundant API calls
_company_info_cache = {}
_CACHE_TTL = 3600  # 1 hour

def _get_cached_company_info(company, domain, job_role):
    """Return cached company info if available and not expired."""
    cache_key = f"{company}|{domain}|{job_role}"
    if cache_key in _company_info_cache:
        info, timestamp = _company_info_cache[cache_key]
        if time.time() - timestamp < _CACHE_TTL:
            return info
    return None

def _set_cached_company_info(company, domain, job_role, info):
    cache_key = f"{company}|{domain}|{job_role}"
    _company_info_cache[cache_key] = (info, time.time())

def load_question_pool(category, domain=None, difficulty='medium'):
    """
    Loads questions from the database instead of JSON files.
    """
    query = QuestionBank.objects(category=category, company_name=None)
    if domain and category == 'technical':
        domain_key = domain.lower().replace(" ", "_")
        query = query.filter(domain=domain_key)

    questions = query.filter(difficulty=difficulty).all()
    if not questions and difficulty != 'medium':
        questions = query.filter(difficulty='medium').all()

    return questions


def load_question_pools_by_difficulty(category, domain=None):
    """
    Loads questions grouped by difficulty for adaptive selection.
    Returns dict: {'easy': [...], 'medium': [...], 'hard': [...]}
    """
    pools = {'easy': [], 'medium': [], 'hard': []}
    query = QuestionBank.objects(category=category, company_name=None)

    if domain and category == 'technical':
        domain_key = domain.lower().replace(" ", "_")
        query = query.filter(domain=domain_key)

    all_questions = list(query.all())

    for q in all_questions:
        diff = q.difficulty or 'medium'
        if diff in pools:
            pools[diff].append(q)

    return pools


def get_agents_for_mode(interview_mode: str) -> list:
    """Returns list of agents that will be used based on interview mode."""
    if interview_mode == 'hr':
        return ['hr']
    elif interview_mode == 'technical':
        return ['technical']
    elif interview_mode == 'stress':
        return ['stress']
    else:  # mixed or full
        return ['hr', 'technical', 'stress']

def _fetch_company_questions_sync(company, job_role, domain_norm, difficulty):
    """Fetch company questions from DB or scrape them. Runs in thread executor."""
    # Check dedicated table for company questions
    company_questions = CompanyQuestionBank.objects(
        company_name=company, role=job_role, domain=domain_norm
    ).all()
    
    # Fallback: broader search
    if not company_questions:
        company_questions = CompanyQuestionBank.objects(
            company_name=company, domain=domain_norm
        ).all()
    
    # Fallback: scrape from internet
    if not company_questions:
        print(f"Fetching new questions for {company} {job_role} from internet...")
        fetched_texts = scraper_agent.fetch_company_questions(company, job_role, difficulty)
        for q_text in fetched_texts:
            new_q = CompanyQuestionBank(
                company_name=company,
                role=job_role,
                domain=domain_norm,
                category='technical', 
                difficulty=difficulty,
                question_text=q_text,
                subtype='company_scraped'
            )
            new_q.save()
        
        company_questions = CompanyQuestionBank.objects(
            company_name=company, role=job_role, domain=domain_norm
        ).all()
    
    return list(company_questions)

def _fetch_company_info_cached(company, domain, job_role):
    """Fetch company info with in-memory caching."""
    cached = _get_cached_company_info(company, domain, job_role)
    if cached:
        print(f"DEBUG: Using cached company info for {company}")
        return cached
    
    info = company_agent.fetch_company_info(company, domain, job_role)
    _set_cached_company_info(company, domain, job_role, info)
    return info

async def start_interview(user_id, setup_data):
    """
    Initializes a new interview session with adaptive difficulty.
    First 40-50% questions are easy, then dynamically adjusts based on performance.
    Only uses agents relevant to the selected interview_mode.
    """
    domain = setup_data.get('domain', 'General')
    company = setup_data.get('company_name', 'General')
    # Job role defaults to domain if not provided
    job_role = setup_data.get('job_role') or domain or 'Software Engineer'
    # Always start with 'easy' - adaptive engine will adjust based on performance
    difficulty = 'easy'
    interview_mode = setup_data.get('interview_mode', 'mixed')
    answer_mode = setup_data.get('answer_mode', 'text')
    total_questions = setup_data.get('total_questions', 5)
    duration_minutes = setup_data.get('duration_minutes', 10)

    domain_norm = domain.lower().replace(" ", "_").replace("&", "and")

    # Determine which agents will be used based on interview mode
    agents_used = get_agents_for_mode(interview_mode)

    # 1. Create Interview Session Record
    session = InterviewSession(
        user=user_id,
        domain=domain,
        domain_key=domain_norm,
        company_name=company,
        job_role=job_role,
        difficulty=difficulty,
        interview_mode=interview_mode,
        answer_mode=answer_mode,
        total_questions=total_questions,
        duration_minutes=duration_minutes
    )
    session.save()

    # Initialize adaptive difficulty engine for this session
    adaptive_difficulty.get_engine(str(session.id), total_questions)

    # Update User Progress Stats
    from backend.models.user import User
    user = User.objects(id=user_id).first()
    if user:
        user.interviews_in_progress += 1
        user.save()

    # 2. Fetch company info + company questions IN PARALLEL
    loop = asyncio.get_running_loop()

    company_info_task = loop.run_in_executor(
        None, _fetch_company_info_cached, company, domain, job_role
    )

    company_questions = []
    company_q_task = None
    if company and company.lower() != 'general':
        company_q_task = loop.run_in_executor(
            None, _fetch_company_questions_sync, company, job_role, domain_norm, 'easy'
        )

    company_info = await company_info_task
    if company_q_task:
        company_questions = await company_q_task

    # 3. Build question plan based on selected agent mode
    # IMPORTANT: Only use the agents specified by interview_mode
    question_plan = []
    n = total_questions

    if interview_mode == 'hr':
        # Only HR questions
        question_plan = [('hr', 'easy')] * n
    elif interview_mode == 'technical':
        # Only Technical questions
        question_plan = [('technical', 'easy')] * n
    elif interview_mode == 'stress':
        # Only Stress questions
        question_plan = [('stress', 'easy')] * n
    else:
        # Mixed: distribute across HR, Technical, Stress
        tech_count = max(1, round(n * 0.4))
        hr_count = max(1, round(n * 0.35))
        stress_count = max(0, n - tech_count - hr_count)

        for _ in range(hr_count):
            question_plan.append(('hr', 'easy'))
        for _ in range(tech_count):
            question_plan.append(('technical', 'easy'))
        for _ in range(stress_count):
            question_plan.append(('stress', 'easy'))

        random.shuffle(question_plan)

    first_question_obj = None

    # Company question handling
    if company and company.lower() != 'general':
        company_target_count = session.total_questions
    else:
        company_target_count = 0

    used_company_q_ids = []

    # Start with easy difficulty - adaptive engine will adjust later
    initial_difficulty = 'easy'

    for i, (cat, _) in enumerate(question_plan):
        sq = None
        available_cq = [q for q in company_questions if q.id not in used_company_q_ids]

        if available_cq and len(used_company_q_ids) < company_target_count and cat in agents_used:
            q_data = random.choice(available_cq)
            used_company_q_ids.append(q_data.id)

            sq = SessionQuestion(
                session=session,
                question_bank_id=str(q_data.id),
                question_text=q_data.question_text,
                question_type=cat,
                question_subtype='company_specific',
                requires_code=False,
                order_number=i + 1,
                difficulty=initial_difficulty,
                question_started_at=datetime.utcnow() if i == 0 else None
            )
        else:
            options = load_question_pool(cat, domain, initial_difficulty)
            if answer_mode in ['audio', 'video']:
                options = [opt for opt in options if not opt.requires_code]

            if not options:
                sq = SessionQuestion(
                    session=session,
                    question_bank_id=f'{cat}_fallback_{i}',
                    question_text=f'Tell me about your experience related to {domain}.',
                    question_type=cat,
                    question_subtype='behavioural',
                    requires_code=False,
                    order_number=i + 1,
                    difficulty=initial_difficulty,
                    question_started_at=datetime.utcnow() if i == 0 else None
                )
            else:
                q_data = random.choice(options)
                sq = SessionQuestion(
                    session=session,
                    question_bank_id=str(q_data.id),
                    question_text=q_data.question_text,
                    question_type=q_data.category,
                    question_subtype=q_data.subtype or 'behavioural',
                    requires_code=q_data.requires_code,
                    order_number=i + 1,
                    difficulty=q_data.difficulty or initial_difficulty,
                    question_started_at=datetime.utcnow() if i == 0 else None
                )

        if sq:
            sq.save()
            if i == 0:
                first_question_obj = sq

    return {
        "session_id": str(session.id),
        "first_question": first_question_obj.to_dict() if first_question_obj else None,
        "company_info": company_info,
        "total_questions": session.total_questions,
        "agents_used": agents_used,
        "interview_mode": interview_mode
    }

async def complete_interview(session_id):
    """
    Finalizes the interview and generates the comprehensive evaluation report.
    Includes detailed analytics, performance trends, and agent-specific metrics.
    """
    session = InterviewSession.objects(id=session_id).first()
    if not session:
        return None

    existing_eval = EvaluationScore.objects(session=session_id).first()
    if existing_eval:
        return existing_eval.to_dict()

    questions = list(SessionQuestion.objects(session=session_id).all())
    agents_used = get_agents_for_mode(session.interview_mode)

    # Build question results with detailed metrics
    all_question_results = []
    total_filler_words = 0
    per_question_data = []

    for q in questions:
        result = {
            "question_type": q.question_type,
            "question_text": q.question_text,
            "answer": q.transcript or q.text_answer or "",
            "scores": q.question_scores or {},
            "feedback": q.question_feedback or "",
            "difficulty": q.difficulty or "medium"
        }
        all_question_results.append(result)
        total_filler_words += q.filler_word_count or 0

        # Per-question analytics data
        per_question_data.append({
            "question": q.order_number,
            "type": q.question_type,
            "difficulty": q.difficulty or "medium",
            "score": q.hr_score or q.technical_score or q.stress_score or 5.0,
            "time": q.time_taken_seconds or 60,
            "confidence": q.confidence_score
        })

    # Get performance summary from adaptive engine
    engine = adaptive_difficulty.get_engine(str(session_id), session.total_questions)
    perf_summary = engine.get_performance_summary()

    # 1. Start concurrent evaluations
    loop = asyncio.get_running_loop()

    tasks = [
        loop.run_in_executor(None, company_agent.fetch_company_info, session.company_name, session.domain, session.job_role),
        loop.run_in_executor(None, final_score.aggregate_question_scores, questions)
    ]

    company_info, avg_scores = await asyncio.gather(*tasks)

    # 2. Evaluate company fit
    all_answers = [{"question": q.question_text, "answer": q.transcript or q.text_answer} for q in questions]
    fit_analysis = company_agent.evaluate_company_fit(all_answers, company_info, session.domain, session.job_role, session.answer_mode)

    # 3. Run the Coordinator Agent with interview mode context
    session_info = {
        "domain": session.domain,
        "job_role": session.job_role,
        "company_name": session.company_name,
        "answer_mode": session.answer_mode,
        "interview_mode": session.interview_mode,
        "agents_used": agents_used,
        "total_questions": session.total_questions
    }

    coordinator_report = coordinator_agent.evaluate(all_question_results, session_info, company_info)

    # 4. Compute weighted final score (adjusted for interview mode)
    if session.interview_mode in ['hr', 'technical', 'stress']:
        # Single agent mode - that agent is 100% of the score
        if session.interview_mode == 'hr':
            final_percent = avg_scores.get("hr", 5.0) * 10
        elif session.interview_mode == 'technical':
            final_percent = avg_scores.get("technical", 5.0) * 10
        else:
            final_percent = avg_scores.get("stress", 5.0) * 10
        grade = final_score.get_letter_grade(final_percent)
        breakdown = {session.interview_mode: round(avg_scores.get(session.interview_mode, 5.0) * 10, 2)}
    else:
        final_report = final_score.compute_final_score(
            hr_overall=avg_scores.get("hr", 5.0),
            technical_overall=avg_scores.get("technical", 5.0),
            stress_overall=avg_scores.get("stress", 5.0),
            company_fit=fit_analysis.get("overall", 5.0),
            answer_mode=session.answer_mode
        )
        final_percent = final_report['final_score']
        grade = final_report.get("grade", "C")
        breakdown = final_report['breakdown']

    # Calculate average response time
    avg_response_time = sum(q.time_taken_seconds or 60 for q in questions) / len(questions) if questions else 0

    # Aggregate detailed sub-scores by agent type
    hr_detailed = _aggregate_agent_subscores(questions, 'hr')
    tech_detailed = _aggregate_agent_subscores(questions, 'technical')
    stress_detailed = _aggregate_agent_subscores(questions, 'stress')

    # 5. Create EvaluationScore Record with full analytics
    evaluation = EvaluationScore(
        session=session,
        interview_mode=session.interview_mode,
        answer_mode=session.answer_mode,
        agents_used=agents_used,
        final_score=final_percent,
        grade=grade,
        hr_overall=avg_scores.get("hr"),
        technical_overall=avg_scores.get("technical"),
        stress_overall=avg_scores.get("stress"),
        company_fit=fit_analysis.get("overall"),
        # HR detailed fields
        hr_clarity=hr_detailed.get('clarity', 0.0),
        hr_relevance=hr_detailed.get('relevance', 0.0),
        hr_professionalism=hr_detailed.get('professionalism', 0.0),
        hr_star_method=hr_detailed.get('star_method', 0.0),
        hr_communication=hr_detailed.get('communication', 0.0),
        # Technical detailed fields
        technical_correctness=tech_detailed.get('correctness', 0.0),
        technical_depth=tech_detailed.get('depth', 0.0),
        technical_efficiency=tech_detailed.get('efficiency', 0.0),
        technical_communication=tech_detailed.get('communication', 0.0),
        technical_problem_solving=tech_detailed.get('problem_solving', 0.0),
        # Stress detailed fields
        stress_composure=stress_detailed.get('composure', 0.0),
        stress_eye_contact=stress_detailed.get('eye_contact', 0.0),
        stress_vocal_steadiness=stress_detailed.get('vocal_steadiness', 0.0),
        stress_text_confidence=stress_detailed.get('text_confidence', 0.0),
        stress_filler_words=stress_detailed.get('filler_words', 0.0),
        stress_response_coherence=stress_detailed.get('response_coherence', 0.0),
        stress_pressure_handling=stress_detailed.get('pressure_handling', 0.0),
        hr_feedback=coordinator_report.get("hr_summary", "") if 'hr' in agents_used else "",
        technical_feedback=coordinator_report.get("technical_summary", "") if 'technical' in agents_used else "",
        stress_feedback=coordinator_report.get("stress_summary", "") if 'stress' in agents_used else "",
        company_feedback=coordinator_report.get("company_fit_summary", ""),
        coordinator_feedback=coordinator_report.get("coordinator_feedback", ""),
        recommendation=coordinator_report.get("recommendation", ""),
        strengths=coordinator_report.get("top_3_strengths", []),
        improvements=coordinator_report.get("top_3_improvements", []),
        roadmap={
            "steps": coordinator_report.get("learning_roadmap", []),
            "next_steps": coordinator_report.get("next_steps", [])
        },
        # Performance analytics
        performance_data={'per_question': per_question_data},
        difficulty_progression=perf_summary.get('difficulty_progression', []),
        average_response_time=avg_response_time,
        total_filler_words=total_filler_words,
        performance_trend=perf_summary.get('performance_trend', 'stable'),
        final_difficulty_reached=perf_summary.get('final_difficulty_reached', 'easy'),
        # Detailed agent analysis
        hr_detailed=hr_detailed,
        technical_detailed=tech_detailed,
        stress_detailed=stress_detailed
    )

    session.status = 'completed'
    session.completed_at = datetime.utcnow()

    evaluation.save()
    session.save()

    # Clean up adaptive engine
    adaptive_difficulty.clear_engine(str(session_id))

    # Update User Progress Stats
    from backend.models.user import User
    user = User.objects(id=session.user.id).first()
    if user:
        if user.interviews_in_progress > 0:
            user.interviews_in_progress -= 1
        user.interviews_completed += 1
        total_score = (user.average_score * (user.interviews_completed - 1)) + final_percent
        user.average_score = total_score / user.interviews_completed
        total_q = len(questions)
        user.total_questions_answered += total_q
        if session.domain not in user.top_domains:
            user.top_domains.append(session.domain)
            if len(user.top_domains) > 5:
                user.top_domains.pop(0)
        user.save()

    return evaluation.to_dict()


def _aggregate_agent_subscores(questions, agent_type):
    """
    Aggregates detailed sub-scores for a specific agent type.
    """
    relevant_qs = [q for q in questions if q.question_type == agent_type]
    if not relevant_qs:
        return {}

    if agent_type == 'hr':
        scores = {
            'clarity': [], 'relevance': [], 'professionalism': [],
            'star_method': [], 'communication': []
        }
        for q in relevant_qs:
            qs = q.question_scores or {}
            for key in scores:
                if key in qs:
                    scores[key].append(float(qs[key]))
        return {k: round(sum(v)/len(v), 2) if v else 0 for k, v in scores.items()}

    elif agent_type == 'technical':
        scores = {
            'correctness': [], 'depth': [], 'efficiency': [],
            'communication': [], 'problem_solving': []
        }
        for q in relevant_qs:
            qs = q.question_scores or {}
            for key in scores:
                if key in qs:
                    scores[key].append(float(qs[key]))
        return {k: round(sum(v)/len(v), 2) if v else 0 for k, v in scores.items()}

    elif agent_type == 'stress':
        scores = {
            'composure': [], 'confidence': [], 'stress_management': [],
            'eye_contact': [], 'vocal_steadiness': []
        }
        for q in relevant_qs:
            qs = q.question_scores or {}
            for key in scores:
                if key in qs:
                    scores[key].append(float(qs[key]))
        return {k: round(sum(v)/len(v), 2) if v else 0 for k, v in scores.items()}

    return {}
