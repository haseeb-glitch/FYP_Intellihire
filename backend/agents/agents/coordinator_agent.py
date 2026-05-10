"""
Coordinator Agent — The 5th AI Agent.
Runs at the end of the interview. Synthesizes all other agent outputs
into a final comprehensive report with weighted scores, strengths,
improvements, and a personalized learning roadmap.
"""

from backend.agents.llm_client import call_llm, safe_parse_json


def evaluate(all_question_results, session_info, company_info=None):
    """
    Synthesizes all agent scores into a final comprehensive report.
    Only evaluates agents that were actually used based on interview_mode.

    Args:
        all_question_results: list of dicts, each containing per-question scores from HR/Tech/Stress agents
        session_info: dict with domain, job_role, company_name, answer_mode, interview_mode, agents_used, total_questions
        company_info: dict with company profile data (optional)

    Returns:
        dict with final_percentage, top_3_strengths, top_3_improvements,
        learning_roadmap, next_steps, recommendation, coordinator_feedback
    """

    interview_mode = session_info.get('interview_mode', 'mixed')
    agents_used = session_info.get('agents_used', ['hr', 'technical', 'stress'])

    # Build a summary of all scores for the LLM
    score_summary = []
    for i, result in enumerate(all_question_results):
        entry = {
            "question_number": i + 1,
            "question_type": result.get("question_type", "unknown"),
            "question_text": result.get("question_text", ""),
            "difficulty": result.get("difficulty", "medium"),
            "scores": result.get("scores", {}),
            "feedback": result.get("feedback", "")
        }
        score_summary.append(entry)

    # Build agent-specific instructions based on which agents were used
    agent_summaries_instruction = ""
    if 'hr' in agents_used:
        agent_summaries_instruction += "- hr_summary (string): 2-sentence summary of HR/behavioral performance.\n"
    if 'technical' in agents_used:
        agent_summaries_instruction += "- technical_summary (string): 2-sentence summary of technical performance.\n"
    if 'stress' in agents_used:
        agent_summaries_instruction += "- stress_summary (string): 2-sentence summary of composure under pressure.\n"

    mode_context = ""
    if interview_mode == 'hr':
        mode_context = "This was an HR-focused interview. Only HR/behavioral skills were evaluated."
    elif interview_mode == 'technical':
        mode_context = "This was a Technical-focused interview. Only technical skills were evaluated."
    elif interview_mode == 'stress':
        mode_context = "This was a Stress-testing interview. Only stress handling and composure were evaluated."
    else:
        mode_context = "This was a Full/Mixed interview covering HR, Technical, and Stress assessment."

    system_prompt = f"""You are the Coordinator Agent — the senior panel lead in a simulated AI interview.
Your role is to synthesize ALL evaluation data into ONE final, comprehensive interview report.

Interview Context:
- Domain: {session_info.get('domain', 'General')}
- Job Role: {session_info.get('job_role', 'Software Engineer')}
- Company: {session_info.get('company_name', 'Tech Company')}
- Answer Mode: {session_info.get('answer_mode', 'text')}
- Interview Mode: {interview_mode}
- Agents Used: {', '.join(agents_used)}
- Total Questions: {session_info.get('total_questions', 5)}

{mode_context}

Company Profile: {company_info or 'Not available'}

Per-Question Agent Evaluations:
{score_summary}

Based on ALL the above data, produce a comprehensive final report in strict JSON format with these keys:
- top_3_strengths (list of strings): The candidate's top 3 demonstrated strengths relevant to the agents used.
- top_3_improvements (list of strings): The candidate's top 3 areas for improvement relevant to the agents used.
{agent_summaries_instruction}- company_fit_summary (string): 2-sentence summary of company/role alignment.
- learning_roadmap (list of strings): 3-5 specific actionable steps for improvement, tailored to the interview type.
- next_steps (list of strings): 2-3 recommended next actions.
- recommendation (string): STRICTLY follow this mapping based on the per-question agent scores:
    * If MOST scores are 0-3: 'No Hire'
    * If MOST scores are 3-5: 'Lean No Hire'
    * If MOST scores are 5-6: 'Lean Hire'
    * If MOST scores are 6-8: 'Hire'
    * If MOST scores are 8-10: 'Strong Hire'
    IMPORTANT: If the candidate gave wrong, irrelevant, or very brief answers, the recommendation MUST be 'No Hire' or 'Lean No Hire'. Do NOT give positive recommendations to weak candidates.
- coordinator_feedback (string): A 3-4 sentence professional, honest overall summary. Be direct about weaknesses. If the candidate performed poorly, say so clearly. Focus only on the aspects evaluated ({', '.join(agents_used)}).
"""

    user_message = "Generate the final comprehensive interview report based on all agent evaluations."

    try:
        raw_response = call_llm(system_prompt, user_message)
        result = safe_parse_json(raw_response)
        
        if "error" in result:
            raise ValueError("LLM response parsing failed")
        
        # Ensure all required keys exist with defaults
        defaults = {
            "final_percentage": 50.0,
            "grade": "C",
            "top_3_strengths": ["Communication skills", "Technical foundation", "Professional demeanor"],
            "top_3_improvements": ["Depth of technical answers", "STAR method usage", "Specific examples"],
            "hr_summary": "The candidate showed adequate communication skills.",
            "technical_summary": "The candidate demonstrated foundational technical knowledge.",
            "stress_summary": "The candidate maintained reasonable composure.",
            "company_fit_summary": "The candidate shows potential alignment with the role.",
            "learning_roadmap": ["Review core concepts", "Practice STAR method", "Do mock interviews"],
            "next_steps": ["Practice with harder questions", "Review feedback areas"],
            "recommendation": "Lean Hire",
            "coordinator_feedback": "Overall solid performance with room for improvement."
        }
        
        for key, default_val in defaults.items():
            if key not in result:
                result[key] = default_val
        
        return result
        
    except Exception as e:
        print(f"Coordinator Agent Error: {e}")
        return {
            "final_percentage": 50.0,
            "grade": "C",
            "top_3_strengths": ["Attempted all questions", "Showed willingness to engage", "Basic understanding demonstrated"],
            "top_3_improvements": ["Provide more detailed answers", "Use the STAR method for behavioral questions", "Demonstrate deeper domain knowledge"],
            "hr_summary": "Evaluation could not be fully processed.",
            "technical_summary": "Evaluation could not be fully processed.",
            "stress_summary": "Evaluation could not be fully processed.",
            "company_fit_summary": "Evaluation could not be fully processed.",
            "learning_roadmap": ["Review fundamental concepts in your domain", "Practice answering with the STAR method", "Conduct mock interviews with peers"],
            "next_steps": ["Retake the interview after preparation", "Review the per-question feedback"],
            "recommendation": "Lean No Hire",
            "coordinator_feedback": "An error occurred during final evaluation synthesis. Please review per-question feedback for detailed insights."
        }
