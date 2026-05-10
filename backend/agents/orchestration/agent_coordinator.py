import asyncio
import re
import traceback
from datetime import datetime
from backend.agents.audio import transcription, speech_analysis
from backend.agents.video import posture_analysis
from backend.agents.agents import hr_agent, technical_agent, stress_agent
from backend.agents.orchestration import adaptive_difficulty


def count_filler_words(text: str) -> int:
    """Counts common filler words in a text response using regex for better accuracy."""
    if not text:
        return 0
    text_lower = text.lower()
    fillers = [
        'um', 'uh', 'mm', 'hmm', 'ah', 'er', 'eh', 'like', 'you know', 
        'basically', 'actually', 'literally', 'honestly', 'i mean', 
        'sort of', 'kind of', 'right', 'so', 'well', 'anyway', 'i guess'
    ]
    
    count = 0
    for filler in fillers:
        # \b ensures word boundaries, handling punctuation and start/end of string
        # We escape the filler just in case, though these don't have regex special chars
        pattern = r'\b' + re.escape(filler) + r'\b'
        matches = re.findall(pattern, text_lower)
        count += len(matches)
    return count


async def run_all_agents(question, answer, session, sq):
    """
    Orchestrates the analysis of a question response based on the modality and agent type.
    Includes comprehensive error handling and logging.
    """
    
    transcript = answer
    audio_signals = None
    cv_signals = None
    
    print(f"\n{'='*60}")
    print(f"AGENT COORDINATOR: Processing question #{sq.order_number}")
    print(f"  Question Type: {sq.question_type}")
    print(f"  Answer Mode: {session.answer_mode}")
    print(f"  Answer Length: {len(answer) if answer else 0} chars")
    print(f"  Answer Preview: {(answer or '')[:100]}...")
    print(f"{'='*60}")

    loop = asyncio.get_running_loop()

    # 1. Process Signal Data based on Modality
    try:
        if session.answer_mode == 'audio':
            if sq.audio_file_path:
                print(f"  Processing audio file: {sq.audio_file_path}")
                tasks = [
                    loop.run_in_executor(None, transcription.transcribe, sq.audio_file_path),
                    loop.run_in_executor(None, speech_analysis.analyze, sq.audio_file_path)
                ]
                trans_result, audio_signals = await asyncio.gather(*tasks)
                # Fallback to provided 'answer' if transcription fails
                transcript = trans_result.get("text") or answer or ""
                print(f"  Transcription result: {transcript[:100]}...")
                
        elif session.answer_mode == 'video':
            if sq.video_file_path:
                print(f"  Processing video file: {sq.video_file_path}")
                tasks = [
                    loop.run_in_executor(None, transcription.transcribe, sq.video_file_path),
                    loop.run_in_executor(None, posture_analysis.analyze_posture, sq.video_file_path),
                    loop.run_in_executor(None, speech_analysis.analyze, sq.video_file_path)
                ]
                trans_result, cv_signals, audio_signals = await asyncio.gather(*tasks)
                transcript = trans_result.get("text", "")
                print(f"  Transcription result: {transcript[:100]}...")
    except Exception as e:
        print(f"  ERROR in signal processing: {e}")
        traceback.print_exc()

    # 1.5 Fallback for transcript if empty
    if not transcript and hasattr(sq, 'text_answer') and sq.text_answer:
        transcript = sq.text_answer
        print(f"  Using text_answer as fallback transcript")
    elif not transcript:
        transcript = "[No spoken or written answer provided]"
        print(f"  WARNING: No transcript available, using placeholder")

    # 2. Call the specialized agent
    evaluation = None
    agent_used = sq.question_type
    
    common_args = {
        "question": question,
        "answer": transcript,
        "answer_mode": session.answer_mode,
        "audio_signals": audio_signals,
        "cv_signals": cv_signals
    }

    try:
        print(f"  Calling {sq.question_type.upper()} agent...")
        
        if sq.question_type == 'hr':
            evaluation = await loop.run_in_executor(None, lambda: hr_agent.evaluate(
                **common_args,
                job_role=session.job_role,
                company=session.company_name,
                domain=session.domain
            ))
        elif sq.question_type == 'technical':
            evaluation = await loop.run_in_executor(None, lambda: technical_agent.evaluate(
                **common_args,
                domain=session.domain,
                job_role=session.job_role,
                question_subtype=sq.question_subtype,
                code_submitted=sq.code_submitted,
                code_output=sq.code_output,
                code_language=sq.code_language
            ))
        elif sq.question_type == 'stress':
            evaluation = await loop.run_in_executor(None, lambda: stress_agent.evaluate(
                **common_args
            ))
        else:
            print(f"  WARNING: Unknown question type '{sq.question_type}', skipping agent call")

        if evaluation:
            print(f"  Agent returned scores: overall={evaluation.get('overall', 'MISSING')}")
            print(f"  Agent feedback preview: {str(evaluation.get('feedback', ''))[:100]}...")
        else:
            print(f"  WARNING: Agent returned None evaluation!")

    except Exception as e:
        print(f"  ERROR calling {sq.question_type} agent: {e}")
        traceback.print_exc()
        evaluation = None

    # 3. Save Results back to SessionQuestion (sq)
    sq.transcript = transcript
    sq.audio_signals = audio_signals
    sq.cv_signals = cv_signals

    # Calculate time taken for this answer
    time_taken = 60  # Default
    if sq.question_started_at:
        time_taken = int((datetime.utcnow() - sq.question_started_at).total_seconds())
    sq.time_taken_seconds = time_taken

    # Count filler words
    filler_count = count_filler_words(transcript)
    sq.filler_word_count = filler_count

    overall_score = 5.0  # Default

    if evaluation:
        sq.question_scores = evaluation

        overall_score = evaluation.get("overall")
        if overall_score is not None:
            overall_score = float(overall_score)
            if sq.question_type == 'hr':
                sq.hr_score = overall_score
                sq.clarity_score = float(evaluation.get('clarity', 5.0))
                print(f"  Saved hr_score = {sq.hr_score}")
            elif sq.question_type == 'technical':
                sq.technical_score = overall_score
                # Save code evaluation if present
                if evaluation.get('code_evaluation'):
                    sq.code_evaluation = evaluation.get('code_evaluation')
                print(f"  Saved technical_score = {sq.technical_score}")
            elif sq.question_type == 'stress':
                sq.stress_score = overall_score
                sq.confidence_score = float(evaluation.get('confidence', 5.0))
                sq.composure_score = float(evaluation.get('composure', 5.0))
                print(f"  Saved stress_score = {sq.stress_score}")
        else:
            overall_score = 5.0
            print(f"  WARNING: Agent response missing 'overall' key! Keys: {list(evaluation.keys())}")

        sq.question_feedback = evaluation.get("feedback", "")
    else:
        print(f"  CRITICAL: No evaluation to save for question #{sq.order_number}!")

    # 4. Update adaptive difficulty engine
    confidence_from_eval = None
    if evaluation:
        confidence_from_eval = evaluation.get('confidence', evaluation.get('composure'))

    next_difficulty, perf_summary = adaptive_difficulty.record_and_get_next_difficulty(
        session_id=str(session.id),
        question_number=sq.order_number,
        score=overall_score,
        time_taken=time_taken,
        total_questions=session.total_questions,
        confidence_score=confidence_from_eval
    )

    print(f"  Adaptive Difficulty: Next question should be {next_difficulty.upper()}")
    print(f"  Performance Trend: {perf_summary.get('performance_trend', 'N/A')}")

    try:
        sq.save()
        print(f"  SessionQuestion saved successfully.")
    except Exception as e:
        print(f"  ERROR saving SessionQuestion: {e}")
        traceback.print_exc()

    print(f"{'='*60}\n")

    return {
        "agent_used": agent_used,
        "scores": evaluation,
        "feedback": sq.question_feedback if evaluation else "Agent evaluation failed.",
        "transcript": transcript,
        "audio_signals": audio_signals,
        "cv_signals": cv_signals,
        "next_difficulty": next_difficulty,
        "performance_summary": perf_summary,
        "time_taken": time_taken,
        "filler_words": filler_count
    }
