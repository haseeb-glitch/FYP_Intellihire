"""
Personalized Interview Routes — Handles document upload, question generation,
and session creation for RAG-based personalized interviews.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional, List
from pydantic import BaseModel
import os
import uuid
import tempfile

from backend.routes.auth import get_current_user
from backend.models.personalized import PersonalizedQuestionBank, DocumentChunk, PersonalizedSession
from backend.models.interview import InterviewSession, SessionQuestion
from backend.agents.rag.document_processor import process_document
from backend.agents.rag.question_generator import generate_questions_from_chunks, generate_questions_from_prompt

personalized_router = APIRouter()


class PersonalizedTextSetup(BaseModel):
    prompt_text: str
    job_role: str = "Software Engineer"
    difficulty: str = "medium"
    agent_mode: str = "mixed"
    answer_mode: str = "text"
    total_questions: int = 5
    duration_minutes: int = 10
    focus_areas: Optional[List[str]] = None


@personalized_router.post('/upload-and-generate')
async def upload_document_and_generate(
    file: UploadFile = File(...),
    job_role: str = Form("Software Engineer"),
    difficulty: str = Form("medium"),
    agent_mode: str = Form("mixed"),
    answer_mode: str = Form("text"),
    total_questions: int = Form(5),
    duration_minutes: int = Form(10),
    current_user=Depends(get_current_user)
):
    """
    Upload a document (PDF, DOCX, TXT), process it via RAG,
    generate questions, store them, and start an interview session.
    """
    # Validate file type
    allowed_extensions = ['.pdf', '.docx', '.txt']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext or 'unknown'}. Allowed: {', '.join(allowed_extensions)}"
        )

    # Save uploaded file temporarily
    temp_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'temp_uploads')
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4().hex}{file_ext}")

    try:
        content = await file.read()
        with open(temp_path, 'wb') as f:
            f.write(content)

        # Process document into chunks
        doc_result = process_document(file_path=temp_path, source_name=file.filename)

        # Store chunks in database
        document_id = uuid.uuid4().hex
        for chunk in doc_result['chunks']:
            DocumentChunk(
                user=current_user,
                document_id=document_id,
                source_name=file.filename,
                source_type=file_ext.lstrip('.'),
                chunk_index=chunk['index'],
                chunk_text=chunk['text'],
                chunk_tokens=chunk.get('tokens', 0)
            ).save()

        # Generate questions from chunks using LLM
        # Always start with 'easy' - adaptive engine will adjust based on performance
        questions = generate_questions_from_chunks(
            chunks=doc_result['chunks'],
            agent_mode=agent_mode,
            difficulty='easy',
            total_questions=total_questions,
            job_role=job_role
        )

        if not questions:
            raise HTTPException(status_code=500, detail="Failed to generate questions from document")

        # Store generated questions
        stored_questions = []
        for q in questions:
            pq = PersonalizedQuestionBank(
                user=current_user,
                source_type=file_ext.lstrip('.'),
                source_name=file.filename,
                source_hash=doc_result.get('source_hash', ''),
                category=q.get('category', 'technical'),
                difficulty=q.get('difficulty', difficulty),
                question_text=q['question_text'],
                context_excerpt=q.get('context_excerpt', ''),
                expected_topics=q.get('expected_topics', []),
                subtype=q.get('subtype', 'conceptual'),
                requires_code=q.get('requires_code', False)
            )
            pq.save()
            stored_questions.append(pq)

        # Create interview session - always start with 'easy' difficulty
        session = InterviewSession(
            user=current_user,
            company_name="Personalized",
            job_role=job_role,
            domain="Personalized",
            domain_key="personalized",
            difficulty='easy',
            interview_mode=agent_mode,
            answer_mode=answer_mode,
            total_questions=len(stored_questions),
            duration_minutes=duration_minutes
        )
        session.save()

        # Create session questions - all start as 'easy', adaptive engine will adjust
        for i, pq in enumerate(stored_questions):
            sq = SessionQuestion(
                session=session,
                question_text=pq.question_text,
                question_type=pq.category,
                question_subtype=pq.subtype or 'conceptual',
                difficulty='easy',
                order_number=i + 1,
                requires_code=pq.requires_code
            )
            sq.save()

        # Create personalized session tracking record
        PersonalizedSession(
            user=current_user,
            interview_session=session,
            document_ids=[document_id],
            source_summary=doc_result.get('preview', ''),
            target_role=job_role,
            questions_generated=len(stored_questions)
        ).save()

        # Return response with first question
        first_sq = SessionQuestion.objects(session=session).order_by('order_number').first()

        return {
            "session_id": str(session.id),
            "total_questions": len(stored_questions),
            "document_info": {
                "name": file.filename,
                "chunks": doc_result['total_chunks'],
                "topics": doc_result.get('key_topics', [])[:5]
            },
            "first_question": {
                "id": str(first_sq.id),
                "text": first_sq.question_text,
                "type": first_sq.question_type,
                "difficulty": first_sq.difficulty,
                "order": 1,
                "total": len(stored_questions)
            } if first_sq else None
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Personalized upload error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)


@personalized_router.post('/text-generate')
async def generate_from_text(
    setup: PersonalizedTextSetup,
    current_user=Depends(get_current_user)
):
    """
    Generate questions from a user-provided text prompt (no file upload).
    """
    if not setup.prompt_text or len(setup.prompt_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Please provide a meaningful prompt (at least 10 characters)")

    try:
        # Generate questions from prompt text - start with 'easy' for adaptive progression
        questions = generate_questions_from_prompt(
            prompt_text=setup.prompt_text,
            agent_mode=setup.agent_mode,
            difficulty='easy',
            total_questions=setup.total_questions,
            job_role=setup.job_role
        )

        if not questions:
            raise HTTPException(status_code=500, detail="Failed to generate questions from prompt")

        # Store generated questions
        stored_questions = []
        for q in questions:
            pq = PersonalizedQuestionBank(
                user=current_user,
                source_type='text',
                source_name='Custom Prompt',
                category=q.get('category', 'technical'),
                difficulty=q.get('difficulty', setup.difficulty),
                question_text=q['question_text'],
                context_excerpt=q.get('context_excerpt', ''),
                expected_topics=q.get('expected_topics', []),
                subtype=q.get('subtype', 'conceptual'),
                requires_code=q.get('requires_code', False)
            )
            pq.save()
            stored_questions.append(pq)

        # Create interview session - always start with 'easy' difficulty
        session = InterviewSession(
            user=current_user,
            company_name="Personalized",
            job_role=setup.job_role,
            domain="Personalized",
            domain_key="personalized",
            difficulty='easy',
            interview_mode=setup.agent_mode,
            answer_mode=setup.answer_mode,
            total_questions=len(stored_questions),
            duration_minutes=setup.duration_minutes
        )
        session.save()

        # Create session questions - all start as 'easy', adaptive engine will adjust
        for i, pq in enumerate(stored_questions):
            sq = SessionQuestion(
                session=session,
                question_text=pq.question_text,
                question_type=pq.category,
                question_subtype=pq.subtype or 'conceptual',
                difficulty='easy',
                order_number=i + 1,
                requires_code=pq.requires_code
            )
            sq.save()

        # Track personalized session
        PersonalizedSession(
            user=current_user,
            interview_session=session,
            prompt_text=setup.prompt_text[:2000],
            focus_areas=setup.focus_areas or [],
            target_role=setup.job_role,
            questions_generated=len(stored_questions)
        ).save()

        first_sq = SessionQuestion.objects(session=session).order_by('order_number').first()

        return {
            "session_id": str(session.id),
            "total_questions": len(stored_questions),
            "first_question": {
                "id": str(first_sq.id),
                "text": first_sq.question_text,
                "type": first_sq.question_type,
                "difficulty": first_sq.difficulty,
                "order": 1,
                "total": len(stored_questions)
            } if first_sq else None
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Personalized text-generate error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")
