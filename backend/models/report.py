from datetime import datetime
from backend import db

class EvaluationScore(db.Document):
    meta = {'collection': 'evaluation_scores'}

    session = db.ReferenceField('InterviewSession', unique=True, required=True, reverse_delete_rule=db.CASCADE)

    # Interview context (for conditional display)
    interview_mode = db.StringField(max_length=20)  # hr/technical/stress/mixed
    answer_mode = db.StringField(max_length=20)  # text/audio/video
    agents_used = db.ListField(db.StringField())  # ['hr', 'technical', 'stress']

    # HR Sub-scores
    hr_clarity = db.FloatField(default=0.0)
    hr_relevance = db.FloatField(default=0.0)
    hr_professionalism = db.FloatField(default=0.0)
    hr_star_method = db.FloatField(default=0.0)
    hr_communication = db.FloatField(default=0.0)
    hr_overall = db.FloatField(default=0.0)

    # Technical Sub-scores
    technical_correctness = db.FloatField(default=0.0)
    technical_depth = db.FloatField(default=0.0)
    technical_efficiency = db.FloatField(default=0.0)
    technical_communication = db.FloatField(default=0.0)
    technical_problem_solving = db.FloatField(default=0.0)
    technical_overall = db.FloatField(default=0.0)

    # Stress Sub-scores (expanded)
    stress_composure = db.FloatField(default=0.0)
    stress_eye_contact = db.FloatField(default=0.0)
    stress_vocal_steadiness = db.FloatField(default=0.0)
    stress_text_confidence = db.FloatField(default=0.0)
    stress_filler_words = db.FloatField(default=0.0)  # Lower = better
    stress_response_coherence = db.FloatField(default=0.0)
    stress_pressure_handling = db.FloatField(default=0.0)
    stress_overall = db.FloatField(default=0.0)

    # Final Metrics
    company_fit = db.FloatField(default=0.0)
    final_score = db.FloatField(default=0.0)
    grade = db.StringField(max_length=2)  # A, B, C, D, F

    # Feedback Text
    hr_feedback = db.StringField()
    technical_feedback = db.StringField()
    stress_feedback = db.StringField()
    company_feedback = db.StringField()
    coordinator_feedback = db.StringField()
    recommendation = db.StringField()

    # Structured Data
    strengths = db.ListField(db.StringField())
    improvements = db.ListField(db.StringField())
    roadmap = db.DictField()
    bias_flags = db.ListField(db.StringField())

    # Performance analytics (for graphs)
    performance_data = db.DictField()  # per-question scores, times, difficulties
    difficulty_progression = db.ListField(db.DictField())  # [{difficulty, count}]
    average_response_time = db.FloatField(default=0.0)
    total_filler_words = db.IntField(default=0)
    performance_trend = db.StringField(max_length=20)  # improving/declining/stable
    final_difficulty_reached = db.StringField(max_length=20)  # easy/medium/hard

    # Agent-specific detailed analysis
    hr_detailed = db.DictField()  # Additional HR metrics
    technical_detailed = db.DictField()  # Additional tech metrics
    stress_detailed = db.DictField()  # Additional stress metrics

    created_at = db.DateTimeField(default=datetime.utcnow)

    def to_dict(self):
        return {
            'session_id': str(self.session.id) if self.session else None,
            'interview_mode': self.interview_mode,
            'answer_mode': self.answer_mode,
            'agents_used': self.agents_used or [],
            'hr_scores': {
                'clarity': self.hr_clarity,
                'relevance': self.hr_relevance,
                'professionalism': self.hr_professionalism,
                'star_method': self.hr_star_method,
                'communication': self.hr_communication,
                'overall': self.hr_overall
            },
            'technical_scores': {
                'correctness': self.technical_correctness,
                'depth': self.technical_depth,
                'efficiency': self.technical_efficiency,
                'communication': self.technical_communication,
                'problem_solving': self.technical_problem_solving,
                'overall': self.technical_overall
            },
            'stress_scores': {
                'composure': self.stress_composure,
                'eye_contact': self.stress_eye_contact,
                'vocal_steadiness': self.stress_vocal_steadiness,
                'text_confidence': self.stress_text_confidence,
                'filler_words': self.stress_filler_words,
                'response_coherence': self.stress_response_coherence,
                'pressure_handling': self.stress_pressure_handling,
                'overall': self.stress_overall
            },
            'company_fit': self.company_fit,
            'final_score': self.final_score,
            'grade': self.grade,
            'feedbacks': {
                'hr': self.hr_feedback,
                'technical': self.technical_feedback,
                'stress': self.stress_feedback,
                'company': self.company_feedback,
                'coordinator': self.coordinator_feedback
            },
            'recommendation': self.recommendation,
            'strengths': self.strengths,
            'improvements': self.improvements,
            'roadmap': self.roadmap,
            'bias_flags': self.bias_flags,
            'performance_analytics': {
                'performance_data': self.performance_data or {},
                'difficulty_progression': self.difficulty_progression or [],
                'average_response_time': self.average_response_time,
                'total_filler_words': self.total_filler_words,
                'performance_trend': self.performance_trend,
                'final_difficulty_reached': self.final_difficulty_reached
            },
            'detailed_analysis': {
                'hr': self.hr_detailed or {},
                'technical': self.technical_detailed or {},
                'stress': self.stress_detailed or {}
            },
            'created_at': self.created_at.isoformat() if self.created_at else None
        }