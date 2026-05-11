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


def calculate_wpm(text: str, time_taken_seconds: int) -> float:
    """Calculate words per minute from transcript and time taken."""
    if not text or time_taken_seconds <= 0:
        return 0.0
    words = len(text.split())
    minutes = time_taken_seconds / 60.0
    wpm = words / minutes if minutes > 0 else 0.0
    return round(wpm, 1)


def calculate_confidence_from_speech(wpm: float, filler_count: int, transcript: str) -> float:
    """
    Calculate confidence score (0-10) based on:
    - Words per minute (target 130 wpm)
    - Filler word count
    - Transcript length
    """
    base_score = 5.0
    
    # WPM scoring (optimal is around 130 wpm)
    optimal_wpm = 130
    wpm_diff = abs(wpm - optimal_wpm)
    if wpm_diff <= 20:  # Within 20 of optimal
        wpm_score = 2.0
    elif wpm_diff <= 50:  # Within 50 of optimal
        wpm_score = 1.0
    else:  # Far from optimal
        wpm_score = -1.0
    
    # Filler word scoring
    word_count = len(transcript.split()) if transcript else 0
    if word_count > 0:
        filler_ratio = (filler_count / word_count) * 100
        if filler_ratio < 5:  # Less than 5% fillers
            filler_score = 1.5
        elif filler_ratio < 15:  # Less than 15% fillers
            filler_score = 0.5
        else:  # More than 15% fillers
            filler_score = -1.0
    else:
        filler_score = 0.0
    
    confidence = base_score + wpm_score + filler_score
    return round(max(1.0, min(10.0, confidence)), 1)


def extract_video_metrics(cv_signals: dict) -> dict:
    """Extract and format video metrics from cv_signals."""
    if not cv_signals:
        return {}
    
    return {
        "dominant_emotion": cv_signals.get("dominant_emotion", "neutral"),
        "emotion_confidence": cv_signals.get("emotion_confidence", 0),
        "average_stress": cv_signals.get("average_stress", 0),
        "peak_stress": cv_signals.get("peak_stress", 0),
        "gaze_score": cv_signals.get("gaze_score", 0),
        "posture_score": cv_signals.get("posture_score", 0),
        "blink_count": cv_signals.get("blink_statistics", {}).get("total", 0),
        "eye_contact_percentage": cv_signals.get("eye_contact_percentage", 0),
    }


def generate_video_tips(video_metrics: dict, video_mode: bool = False) -> list:
    """Generate actionable tips based on video metrics."""
    if not video_mode or not video_metrics:
        return []
    
    tips = []
    
    # Emotion tips
    emotion = video_metrics.get("dominant_emotion", "neutral").lower()
    if emotion == "nervous":
        tips.append("Practice deep breathing to manage nervousness. You showed signs of nervousness - remember to take pauses and composed breaths.")
    elif emotion == "confident":
        tips.append("Great emotional control! Your confident demeanor was evident throughout.")
    
    # Stress tips
    avg_stress = video_metrics.get("average_stress", 0)
    if avg_stress > 70:
        tips.append(f"Your stress level was elevated ({int(avg_stress)}%). Try to relax your shoulders, maintain steady breathing, and speak at a measured pace.")
    elif avg_stress > 50:
        tips.append(f"You showed moderate stress ({int(avg_stress)}%). Practice maintaining composure by focusing on your key points.")
    
    # Gaze tips
    gaze_score = video_metrics.get("gaze_score", 0)
    if gaze_score < 40:
        tips.append("Work on maintaining better eye contact with the camera. Looking directly at the lens shows confidence and engagement.")
    elif gaze_score < 60:
        tips.append("Your eye contact was decent but could be improved. Try to minimize glancing away from the camera.")
    
    # Posture tips
    posture_score = video_metrics.get("posture_score", 0)
    if posture_score < 40:
        tips.append("Your posture needs improvement. Sit upright, keep shoulders back, and maintain a professional appearance.")
    elif posture_score < 60:
        tips.append("Good posture awareness. Try to maintain more consistent upright positioning throughout the interview.")
    
    return tips


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
    
    # Calculate WPM
    wpm = calculate_wpm(transcript, time_taken)
    
    # Calculate confidence based on WPM and filler words
    speech_confidence = calculate_confidence_from_speech(wpm, filler_count, transcript)
    
    # Extract video metrics if available
    video_metrics = extract_video_metrics(cv_signals)
    
    # Generate tips based on video performance
    video_tips = generate_video_tips(video_metrics, session.answer_mode == 'video')

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
        "filler_words": filler_count,
        "wpm": wpm,
        "speech_confidence": speech_confidence,
        "video_metrics": video_metrics,
        "video_tips": video_tips
    }
