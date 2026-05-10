from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from datetime import datetime
import mongoengine as db
from backend.models.interview import InterviewSession, SessionQuestion
from backend.routes.auth import get_current_user
from backend.agents.orchestration import interview_manager, agent_coordinator
from backend.processing import interview_controller
from backend.utils import audio_utils, video_utils, constants
from pydantic import BaseModel
from typing import Optional, List

interview_router = APIRouter()

class InterviewSetup(BaseModel):
    domain: str = "General"
    company_name: Optional[str] = "Tech Corp"
    job_role: Optional[str] = "Software Engineer"
    difficulty: str = "medium"
    interview_mode: str = "mixed"
    answer_mode: str = "text"
    total_questions: int = 5
    duration_minutes: int = 10

@interview_router.get('/domains')
async def get_domains():
    return {"domains": constants.SUPPORTED_DOMAINS}

@interview_router.get('/companies')
async def get_companies():
    """Returns the list of supported companies with their domains and roles."""
    return constants.COMPANY_REGISTRY

@interview_router.post('/start', status_code=201)
async def start_interview_endpoint(setup_data: InterviewSetup, current_user = Depends(get_current_user)):
    errors = interview_controller.validate_setup(setup_data.dict())
    if errors:
        raise HTTPException(status_code=400, detail={"message": "Invalid setup data", "errors": errors})

    try:
        result = await interview_manager.start_interview(current_user.id, setup_data.dict())
        return result
    except Exception as e:
        print(f"Start interview error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")

@interview_router.post('/session/{session_id}/answer')
async def submit_answer(
    session_id: str,
    request: Request,
    answer: Optional[str] = Form(None),
    code: Optional[str] = Form(None),
    code_language: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None),
    current_user = Depends(get_current_user)
):
    session = InterviewSession.objects(id=session_id, user=current_user).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    sq = SessionQuestion.objects(
        session=session_id, transcript=None, text_answer=None
    ).order_by('order_number').first()

    if not sq:
        raise HTTPException(status_code=400, detail="All questions answered")

    try:
        answer_text = None

        if session.answer_mode == 'text':
            # Handle JSON body or Form data
            if answer:
                answer_text = answer
            else:
                try:
                    body = await request.json()
                    answer_text = body.get('answer', '')
                    # Check for code in JSON body
                    if not code and body.get('code'):
                        code = body.get('code')
                        code_language = body.get('code_language', 'python')
                except:
                    pass

            sq.text_answer = answer_text

            # Handle code submission for coding questions
            if code and sq.requires_code:
                sq.code_submitted = code
                sq.code_language = code_language or 'python'
                print(f"  Code submitted: {len(code)} chars in {sq.code_language}")

        elif session.answer_mode == 'audio':
            if not audio:
                raise HTTPException(status_code=400, detail="Audio file required")
            
            # Save to disk
            content = await audio.read()
            sq.audio_file_path = audio_utils.save_audio_content(content, session_id, str(sq.id))
            # Save to GridFS
            sq.audio_data.put(content, content_type='audio/webm', filename=f"{sq.id}.webm")

        elif session.answer_mode == 'video':
            if not video:
                raise HTTPException(status_code=400, detail="Video file required")
            
            content = await video.read()
            sq.video_file_path = video_utils.save_video_content(content, session_id, str(sq.id))
            sq.video_data.put(content, content_type='video/webm', filename=f"{sq.id}.webm")

        sq.answered_at = datetime.utcnow()
        sq.save()

        # Orchestrate agent analysis
        answer_for_agents = answer_text or sq.text_answer or ""
        analysis_result = await agent_coordinator.run_all_agents(
            sq.question_text, answer_for_agents, session, sq
        )

        # Update answered count
        session.answered_questions += 1
        session.save()

        # Get next question and update its difficulty based on adaptive engine
        next_sq = SessionQuestion.objects(
            session=session_id, transcript=None, text_answer=None
        ).order_by('order_number').first()

        response = {
            "feedback": analysis_result.get("feedback"),
            "scores": analysis_result.get("scores"),
            "transcript": analysis_result.get("transcript"),
            "finished": next_sq is None,
            "questions_answered": session.answered_questions,
            "total_questions": session.total_questions,
            "time_taken": analysis_result.get("time_taken"),
            "performance_trend": analysis_result.get("performance_summary", {}).get("performance_trend")
        }

        if next_sq:
            # Update next question's difficulty based on adaptive engine
            next_difficulty = analysis_result.get("next_difficulty", "easy")
            next_sq.difficulty = next_difficulty
            next_sq.question_started_at = datetime.utcnow()
            next_sq.save()

            response["next_question"] = interview_controller.build_question_response(next_sq, session)
            response["next_difficulty"] = next_difficulty
        else:
            try:
                await interview_manager.complete_interview(session_id)
            except Exception as e:
                import traceback
                print(f"COMPLETION ERROR: {e}")
                traceback.print_exc()

        return response

    except Exception as e:
        print(f"Submit answer error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing answer: {str(e)}")

@interview_router.post('/session/{session_id}/complete')
async def complete_session(session_id: str, current_user = Depends(get_current_user)):
    """Manually trigger interview completion and report generation."""
    session = InterviewSession.objects(id=session_id, user=current_user).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        result = await interview_manager.complete_interview(session_id)
        if result:
            return result
        raise HTTPException(status_code=500, detail="Failed to complete interview")
    except Exception as e:
        print(f"Complete interview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@interview_router.get('/sessions')
async def get_sessions(current_user = Depends(get_current_user)):
    sessions = InterviewSession.objects(
        user=current_user
    ).order_by('-started_at').all()
    
    result = []
    for s in sessions:
        session_data = s.to_dict()
        from backend.models.report import EvaluationScore
        evaluation = EvaluationScore.objects(session=s).first()
        if evaluation:
            session_data['final_score'] = evaluation.final_score
        result.append(session_data)
    
    return result

@interview_router.get('/session/{session_id}')
async def get_session_detail(session_id: str, current_user = Depends(get_current_user)):
    session = InterviewSession.objects(id=session_id, user=current_user).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    questions = SessionQuestion.objects(
        session=session_id
    ).order_by('order_number').all()

    result = session.to_dict()
    result['questions'] = [q.to_dict() for q in questions]
    
    from backend.models.report import EvaluationScore
    evaluation = EvaluationScore.objects(session=session).first()
    if evaluation:
        result['evaluation'] = evaluation.to_dict()

    return result