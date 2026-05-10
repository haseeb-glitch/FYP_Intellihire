"""
Models for Personalized Interview System with RAG
"""

from datetime import datetime
from backend import db


class PersonalizedQuestionBank(db.Document):
    """
    Stores questions generated from user-uploaded documents via RAG.
    """
    meta = {'collection': 'personalized_questions'}

    user = db.ReferenceField('User', required=True)
    session_id = db.StringField(max_length=100)  # Optional: link to specific session

    # Source document info
    source_type = db.StringField(max_length=20)  # 'text', 'pdf', 'docx', 'url'
    source_name = db.StringField(max_length=255)  # Original filename or URL
    source_hash = db.StringField(max_length=64)  # To detect duplicates

    # Question data
    category = db.StringField(max_length=50)  # hr, technical, stress
    difficulty = db.StringField(max_length=20)  # easy, medium, hard
    question_text = db.StringField(required=True)
    context_excerpt = db.StringField()  # The chunk of document this Q is based on
    expected_topics = db.ListField(db.StringField())  # Topics the answer should cover
    subtype = db.StringField(max_length=50)  # conceptual, practical, situational

    # Metadata
    requires_code = db.BooleanField(default=False)
    language = db.StringField(max_length=30)
    is_used = db.BooleanField(default=False)  # Track if question has been asked
    created_at = db.DateTimeField(default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user.id) if self.user else None,
            'source_type': self.source_type,
            'source_name': self.source_name,
            'category': self.category,
            'difficulty': self.difficulty,
            'question_text': self.question_text,
            'context_excerpt': self.context_excerpt,
            'expected_topics': self.expected_topics or [],
            'subtype': self.subtype,
            'requires_code': self.requires_code,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class DocumentChunk(db.Document):
    """
    Stores chunked document content for RAG retrieval.
    """
    meta = {'collection': 'document_chunks'}

    user = db.ReferenceField('User', required=True)
    document_id = db.StringField(max_length=100, required=True)  # Groups chunks by document
    source_name = db.StringField(max_length=255)
    source_type = db.StringField(max_length=20)

    # Chunk data
    chunk_index = db.IntField(required=True)
    chunk_text = db.StringField(required=True)
    chunk_tokens = db.IntField()  # Approximate token count

    # Optional: embeddings for semantic search (stored as list of floats)
    embedding = db.ListField(db.FloatField())

    created_at = db.DateTimeField(default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'document_id': self.document_id,
            'source_name': self.source_name,
            'chunk_index': self.chunk_index,
            'chunk_text': self.chunk_text[:200] + '...' if len(self.chunk_text) > 200 else self.chunk_text
        }


class PersonalizedSession(db.Document):
    """
    Tracks personalized interview sessions with document context.
    """
    meta = {'collection': 'personalized_sessions'}

    user = db.ReferenceField('User', required=True)
    interview_session = db.ReferenceField('InterviewSession')

    # Document sources used
    document_ids = db.ListField(db.StringField())
    source_summary = db.StringField()  # AI-generated summary of uploaded content

    # Configuration
    focus_areas = db.ListField(db.StringField())  # User-specified topics to focus on
    prompt_text = db.StringField()  # User's custom prompt/instructions
    target_role = db.StringField(max_length=100)
    target_company = db.StringField(max_length=100)

    # Stats
    questions_generated = db.IntField(default=0)
    questions_used = db.IntField(default=0)

    created_at = db.DateTimeField(default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user.id) if self.user else None,
            'document_count': len(self.document_ids) if self.document_ids else 0,
            'source_summary': self.source_summary,
            'focus_areas': self.focus_areas or [],
            'prompt_text': self.prompt_text,
            'questions_generated': self.questions_generated,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
