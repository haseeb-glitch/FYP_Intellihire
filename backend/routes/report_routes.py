from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
import io
from backend.models.interview import InterviewSession, SessionQuestion
from backend.models.report import EvaluationScore
from backend.routes.auth import get_current_user
from backend.agents.orchestration import interview_manager
from backend.utils.pdf_generator import generate_report_text

report_router = APIRouter()

@report_router.get('/{session_id}')
async def get_report(session_id: str, current_user = Depends(get_current_user)):
    session = InterviewSession.objects(id=session_id, user=current_user).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session.status != 'completed':
        await interview_manager.complete_interview(session_id)
        
    evaluation = EvaluationScore.objects(session=session_id).first()
    if not evaluation:
        raise HTTPException(status_code=500, detail="Evaluation data missing")
        
    return {
        "session": session.to_dict(),
        "evaluation": evaluation.to_dict()
    }

@report_router.get('/{session_id}/pdf')
async def get_pdf_report(session_id: str, current_user = Depends(get_current_user)):
    session = InterviewSession.objects(id=session_id, user=current_user).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    evaluation = EvaluationScore.objects(session=session_id).first()
    if not evaluation:
        # Try to generate if missing
        await interview_manager.complete_interview(session_id)
        evaluation = EvaluationScore.objects(session=session_id).first()

    questions = SessionQuestion.objects(
        session=session_id
    ).order_by('order_number').all()

    # Try reportlab first, fallback to text
    try:
        from reportlab.lib.pagesizes import LETTER
        from reportlab.pdfgen import canvas as rl_canvas
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=LETTER)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("IntelliHire - Interview Performance Report", styles['Title']))
        elements.append(Spacer(1, 12))

        header_data = [
            ["Candidate", current_user.username],
            ["Role", session.job_role],
            ["Domain", session.domain],
            ["Company", session.company_name],
            ["Final Score", f"{evaluation.final_score:.1f}%"]
        ]
        t = Table(header_data, colWidths=[100, 300])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey)
        ]))
        elements.append(t)
        elements.append(Spacer(1, 24))

        if evaluation.coordinator_feedback:
            elements.append(Paragraph("Executive Summary", styles['Heading2']))
            elements.append(Paragraph(evaluation.coordinator_feedback, styles['Normal']))
            elements.append(Spacer(1, 12))

        score_data = [
            ["Category", "Score (0-10)"],
            ["Technical", f"{evaluation.technical_overall:.1f}"],
            ["HR / Behavioral", f"{evaluation.hr_overall:.1f}"],
            ["Stress Management", f"{evaluation.stress_overall:.1f}"],
            ["Company Culture Fit", f"{evaluation.company_fit:.1f}"]
        ]
        st = Table(score_data, colWidths=[200, 100])
        st.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.blue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey)
        ]))
        elements.append(Paragraph("Category Breakdown", styles['Heading2']))
        elements.append(st)
        elements.append(Spacer(1, 24))

        if evaluation.strengths:
            elements.append(Paragraph("Top Strengths", styles['Heading2']))
            for s in evaluation.strengths:
                elements.append(Paragraph(f"✓ {s}", styles['Normal']))
            elements.append(Spacer(1, 12))

        if evaluation.improvements:
            elements.append(Paragraph("Areas for Improvement", styles['Heading2']))
            for s in evaluation.improvements:
                elements.append(Paragraph(f"⚠ {s}", styles['Normal']))
            elements.append(Spacer(1, 12))

        if evaluation.roadmap:
            elements.append(Paragraph("Learning Roadmap", styles['Heading2']))
            steps = evaluation.roadmap.get("steps", []) if isinstance(evaluation.roadmap, dict) else evaluation.roadmap
            for step in steps:
                elements.append(Paragraph(f"• {step}", styles['Normal']))

        doc.build(elements)
        buffer.seek(0)
        
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=IntelliHire_Report_{session.id}.pdf"}
        )

    except ImportError:
        # Fallback: generate a plain text report
        report_text = generate_report_text(session, evaluation, questions)
        return Response(
            content=report_text,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename=IntelliHire_Report_{session.id}.txt"}
        )
