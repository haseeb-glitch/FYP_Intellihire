import asyncio
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect
from datetime import datetime
from pathlib import Path

from backend.routes.auth import get_current_user
from backend.models.interview import InterviewSession, SessionQuestion
from backend.services.video_service import video_session_manager
from backend.config import Config
from backend.agents.orchestration import agent_coordinator, interview_manager
from backend.processing import interview_controller
from backend.agents.video import video_analysis
from fastapi import UploadFile

video_router = APIRouter()


@video_router.post('/session/{session_id}/start')
async def start_video_session(session_id: str, current_user = Depends(get_current_user)):
    session = InterviewSession.objects(id=session_id, user=current_user).first()
    if not session:
        raise HTTPException(status_code=404, detail='Session not found')

    if video_session_manager.is_active(session_id):
        raise HTTPException(status_code=409, detail='Video session already active')

    try:
        video_session_manager.create_session(session_id)
        return {"status": "recording", "session_id": session_id}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to start video session: {exc}")


@video_router.post('/session/{session_id}/frame')
async def process_video_frame(
    session_id: str,
    frame: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    session = InterviewSession.objects(id=session_id, user=current_user).first()
    if not session:
        raise HTTPException(status_code=404, detail='Session not found')

    video_session = video_session_manager.get_session(session_id)
    if not video_session or not video_session.is_recording:
        raise HTTPException(status_code=400, detail='No active video session')

    try:
        frame_bytes = await frame.read()
        stats = video_session.process_frame(frame_bytes)
        return {"status": "processed", "stats": stats}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to process video frame: {exc}")


@video_router.post('/session/{session_id}/stop')
async def stop_video_session(session_id: str, request: Request, current_user = Depends(get_current_user)):
    session = InterviewSession.objects(id=session_id, user=current_user).first()
    if not session:
        raise HTTPException(status_code=404, detail='Session not found')

    if not video_session_manager.is_active(session_id):
        raise HTTPException(status_code=400, detail='No active video session to stop')

    try:
        report = video_session_manager.stop_session(session_id)

        sq = SessionQuestion.objects(
            session=session_id, transcript=None, text_answer=None
        ).order_by('order_number').first()
        if not sq:
            raise HTTPException(status_code=400, detail='All questions answered')

        fallback_answer = await _extract_fallback_answer(request)
        transcript = report.get("transcript_text") or fallback_answer or ""
        transcript_error = report.get("transcript_error")
        if not transcript and transcript_error:
            transcript = ""

        upload_root = Path(Config.UPLOAD_FOLDER).parent
        audio_path = upload_root / report.get("audio_path", "")
        video_path = upload_root / report.get("video_path", "")

        sq.audio_file_path = str(audio_path)
        sq.video_file_path = str(video_path)
        sq.transcript = transcript
        sq.transcript_file = report.get("transcript_file")
        sq.cv_signals = _build_cv_signals(report)
        sq.answered_at = datetime.utcnow()
        sq.save()

        analysis_result = await agent_coordinator.run_all_agents(
            sq.question_text, transcript, session, sq
        )

        session.answered_questions += 1
        session.save()

        next_sq = SessionQuestion.objects(
            session=session_id, transcript=None, text_answer=None
        ).order_by('order_number').first()

        response = {
            "status": "stopped",
            "report": report,
            "feedback": analysis_result.get("feedback"),
            "scores": analysis_result.get("scores"),
            "transcript": analysis_result.get("transcript"),
            "transcript_file": report.get("transcript_file"),
            "finished": next_sq is None,
            "questions_answered": session.answered_questions,
            "total_questions": session.total_questions,
            "time_taken": analysis_result.get("time_taken"),
            "performance_trend": analysis_result.get("performance_summary", {}).get("performance_trend"),
            "transcript_error": transcript_error,
        }

        if next_sq:
            next_difficulty = analysis_result.get("next_difficulty", "easy")
            next_sq.difficulty = next_difficulty
            next_sq.question_started_at = datetime.utcnow()
            next_sq.save()
            response["next_question"] = interview_controller.build_question_response(next_sq, session)
            response["next_difficulty"] = next_difficulty
        else:
            try:
                await interview_manager.complete_interview(session_id)
            except Exception as exc:
                print(f"Video interview completion error: {exc}")

        return response
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to stop video session: {exc}")


@video_router.post('/session/{session_id}/submit-video')
async def submit_video(session_id: str, video: UploadFile = File(...), request: Request = None, current_user = Depends(get_current_user)):
    """
    Accept a complete video upload (single blob), run post-recording analysis,
    and return the same response format used by the streaming stop endpoint.
    """
    session = InterviewSession.objects(id=session_id, user=current_user).first()
    if not session:
        raise HTTPException(status_code=404, detail='Session not found')

    sq = SessionQuestion.objects(
        session=session_id, transcript=None, text_answer=None
    ).order_by('order_number').first()
    if not sq:
        raise HTTPException(status_code=400, detail='All questions answered')

    try:
        # Save uploaded video to uploads folder
        upload_root = Path(Config.UPLOAD_FOLDER) / 'sessions' / session_id
        upload_root.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        video_filename = f'video_{timestamp}.webm'
        video_path = upload_root / video_filename

        content = await video.read()
        with open(video_path, 'wb') as f:
            f.write(content)

        # Try to get fallback transcript from form/json if provided
        fallback_answer = ''
        if request is not None:
            fallback_answer = await _extract_fallback_answer(request)

        # Run analysis
        analysis = video_analysis.analyze_video_with_transcript(str(video_path), fallback_answer or '')

        # Populate SessionQuestion
        sq.video_file_path = str(video_path)
        sq.transcript = analysis.get('transcript_text') or fallback_answer or ''
        sq.transcript_file = analysis.get('transcript_file')
        sq.cv_signals = _build_cv_signals(analysis)
        sq.answered_at = datetime.utcnow()
        sq.save()

        # Run agents
        analysis_result = await agent_coordinator.run_all_agents(
            sq.question_text, sq.transcript or '', session, sq
        )

        session.answered_questions += 1
        session.save()

        next_sq = SessionQuestion.objects(
            session=session_id, transcript=None, text_answer=None
        ).order_by('order_number').first()

        response = {
            "status": "processed",
            "report": analysis,
            "feedback": analysis_result.get("feedback"),
            "scores": analysis_result.get("scores"),
            "transcript": analysis_result.get("transcript") or sq.transcript,
            "transcript_file": analysis.get("transcript_file"),
            "finished": next_sq is None,
            "questions_answered": session.answered_questions,
            "total_questions": session.total_questions,
            "time_taken": analysis_result.get("time_taken"),
            "performance_trend": analysis_result.get("performance_summary", {}).get("performance_trend"),
        }

        if next_sq:
            next_difficulty = analysis_result.get("next_difficulty", "easy")
            next_sq.difficulty = next_difficulty
            next_sq.question_started_at = datetime.utcnow()
            next_sq.save()
            response["next_question"] = interview_controller.build_question_response(next_sq, session)
            response["next_difficulty"] = next_difficulty
        else:
            try:
                await interview_manager.complete_interview(session_id)
            except Exception as exc:
                print(f"Video interview completion error: {exc}")

        return response
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to process uploaded video: {exc}")


def _build_cv_signals(report):
    return {
        "session_report": report,
        "dominant_emotion": report.get("dominant_emotion"),
        "top_emotions": report.get("top_emotions"),
        "average_stress": report.get("average_stress"),
        "peak_stress": report.get("peak_stress"),
        "gaze_score": report.get("gaze_score"),
        "posture_score": report.get("posture_score"),
        "blink_statistics": report.get("blink_statistics", {}),
        "video_path": report.get("video_path"),
        "report_path": report.get("report_path"),
    }


async def _extract_fallback_answer(request: Request) -> str:
    content_type = request.headers.get("content-type", "")
    try:
        if "application/json" in content_type:
            payload = await request.json()
            return (payload.get("answer") or payload.get("transcript") or "").strip()
        if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
            form = await request.form()
            return (form.get("answer") or form.get("transcript") or "").strip()
    except Exception:
        return ""
    return ""


@video_router.websocket('/ws/session/{session_id}')
async def video_session_ws(session_id: str, websocket: WebSocket, current_user = Depends(get_current_user)):
    session = InterviewSession.objects(id=session_id, user=current_user).first()
    if not session:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    try:
        while True:
            video_session = video_session_manager.get_session(session_id)
            if video_session:
                with video_session.lock:
                    payload = {
                        "type": "update",
                        "payload": {
                            "frame": video_session.last_frame_b64,
                            "stats": video_session.last_stats,
                            "is_recording": video_session.is_recording,
                        },
                    }
                await websocket.send_json(payload)
            else:
                await websocket.send_json({"type": "status", "payload": {"is_recording": False}})
            try:
                await asyncio.sleep(0.4)
            except asyncio.CancelledError:
                break
    except WebSocketDisconnect:
        return
    except Exception:
        await websocket.close(code=1011)
