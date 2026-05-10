from datetime import datetime
from backend import db

class QuestionBank(db.Document):
    meta = {'collection': 'question_bank'}

    category = db.StringField(max_length=50, required=True)  # hr, technical, stress
    domain = db.StringField(max_length=100)  # software_engineer, data_analyst, etc.
    difficulty = db.StringField(max_length=20)  # easy, medium, hard
    question_text = db.StringField(required=True)
    question_type = db.StringField(max_length=50)
    subtype = db.StringField(max_length=50)  # conceptual, coding, situational
    requires_code = db.BooleanField(default=False)
    language = db.StringField(max_length=30)  # python, javascript, java, etc.
    starter_code = db.StringField()  # Optional starter code template
    test_cases = db.ListField(db.DictField())  # [{input: "", expected_output: ""}]
    company_name = db.StringField(max_length=100)  # None for general
    is_verified = db.BooleanField(default=False)
    created_at = db.DateTimeField(default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'category': self.category,
            'domain': self.domain,
            'difficulty': self.difficulty,
            'question_text': self.question_text,
            'question_type': self.question_type,
            'subtype': self.subtype,
            'requires_code': self.requires_code,
            'language': self.language,
            'starter_code': self.starter_code,
            'test_cases': self.test_cases or [],
            'company_name': self.company_name,
            'is_verified': self.is_verified
        }

class CompanyQuestionBank(db.Document):
    meta = {'collection': 'company_question_bank'}
    
    company_name = db.StringField(max_length=100, required=True)
    role = db.StringField(max_length=100)
    domain = db.StringField(max_length=100)
    category = db.StringField(max_length=50) # technical, hr, stress
    difficulty = db.StringField(max_length=20)
    question_text = db.StringField(required=True)
    subtype = db.StringField(max_length=50)
    created_at = db.DateTimeField(default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'company_name': self.company_name,
            'role': self.role,
            'domain': self.domain,
            'category': self.category,
            'difficulty': self.difficulty,
            'question_text': self.question_text,
            'subtype': self.subtype
        }

class CandidateProfile(db.Document):
    meta = {'collection': 'candidate_profiles'}
    
    user = db.ReferenceField('User', unique=True, required=True)
    resume_path = db.StringField(max_length=255)
    skills = db.ListField(db.StringField())  # List of skills
    target_role = db.StringField(max_length=100)
    experience_summary = db.StringField()
    updated_at = db.DateTimeField(default=datetime.utcnow)

class InterviewSession(db.DynamicDocument):
    meta = {
        'collection': 'interview_sessions',
        'strict': False
    }
    
    user = db.ReferenceField('User', required=True)
    domain = db.StringField(max_length=100, required=True)
    domain_key = db.StringField(max_length=50, required=True)
    company_name = db.StringField(max_length=100)
    job_role = db.StringField(max_length=100)
    difficulty = db.StringField(max_length=20)  # easy, medium, hard
    interview_mode = db.StringField(max_length=20)  # hr, technical, mixed, full
    answer_mode = db.StringField(max_length=20)  # text, audio, video
    status = db.StringField(max_length=20, default='in_progress')  # in_progress, completed
    total_questions = db.IntField(default=0)
    answered_questions = db.IntField(default=0)
    duration_minutes = db.IntField(default=10)
    started_at = db.DateTimeField(default=datetime.utcnow)
    completed_at = db.DateTimeField()

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user.id) if self.user else None,
            'domain': self.domain,
            'domain_key': self.domain_key,
            'company_name': self.company_name,
            'job_role': self.job_role,
            'difficulty': self.difficulty,
            'interview_mode': self.interview_mode,
            'answer_mode': self.answer_mode,
            'status': self.status,
            'total_questions': self.total_questions,
            'answered_questions': self.answered_questions,
            'duration_minutes': self.duration_minutes,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class SessionQuestion(db.Document):
    meta = {'collection': 'session_questions'}

    session = db.ReferenceField('InterviewSession', required=True, reverse_delete_rule=db.CASCADE)
    question_bank_id = db.StringField(max_length=100)
    question_text = db.StringField(required=True)
    question_type = db.StringField(max_length=50)
    question_subtype = db.StringField(max_length=50)
    requires_code = db.BooleanField(default=False)
    order_number = db.IntField()

    # Adaptive difficulty tracking
    difficulty = db.StringField(max_length=20, default='easy')  # easy/medium/hard - dynamic per question
    question_started_at = db.DateTimeField()  # When question was shown

    # Answers and Data
    text_answer = db.StringField()
    audio_file_path = db.StringField(max_length=255)
    video_file_path = db.StringField(max_length=255)

    # Binary storage in MongoDB (GridFS)
    audio_data = db.FileField()
    video_data = db.FileField()
    transcript = db.StringField()
    transcript_file = db.StringField(max_length=255)

    # Code submission fields
    code_submitted = db.StringField()
    code_language = db.StringField(max_length=30)
    code_output = db.StringField()
    code_evaluation = db.DictField()  # {correctness, efficiency, style, feedback}

    # Signals and Scores
    audio_signals = db.DictField()
    cv_signals = db.DictField()
    question_scores = db.DictField()
    question_feedback = db.StringField()

    # Per-question agent scores (set by agent_coordinator)
    hr_score = db.FloatField()
    technical_score = db.FloatField()
    stress_score = db.FloatField()

    # Detailed metrics from agents
    filler_word_count = db.IntField(default=0)
    confidence_score = db.FloatField()
    composure_score = db.FloatField()
    clarity_score = db.FloatField()

    answered_at = db.DateTimeField()
    time_taken_seconds = db.IntField()

    def to_dict(self):
        return {
            'id': str(self.id),
            'session_id': str(self.session.id) if self.session else None,
            'question_text': self.question_text,
            'question_type': self.question_type,
            'question_subtype': self.question_subtype,
            'requires_code': self.requires_code,
            'order_number': self.order_number,
            'difficulty': self.difficulty or 'medium',
            'text_answer': self.text_answer,
            'transcript': self.transcript,
            'transcript_file': self.transcript_file,
            'answered_at': self.answered_at.isoformat() if self.answered_at else None,
            'time_taken_seconds': self.time_taken_seconds,
            'scores': {
                'hr': self.hr_score,
                'technical': self.technical_score,
                'stress': self.stress_score,
                'confidence': self.confidence_score,
                'composure': self.composure_score,
                'clarity': self.clarity_score
            },
            'filler_word_count': self.filler_word_count or 0
        }