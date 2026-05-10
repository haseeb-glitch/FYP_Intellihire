from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from backend import db

class User(db.DynamicDocument):
    meta = {
        'collection': 'users',
        'strict': False
    }
    
    username = db.StringField(max_length=80, unique=True, required=True)
    email = db.StringField(max_length=120, unique=True, required=True)
    password_hash = db.StringField(max_length=255, required=True)
    full_name = db.StringField(max_length=100)
    is_admin = db.BooleanField(default=False)
    created_at = db.DateTimeField(default=datetime.utcnow)
    email_verified = db.BooleanField(default=False)
    otp_code = db.StringField(max_length=10)
    otp_sent_at = db.DateTimeField()
    otp_expires_at = db.DateTimeField()
    
    # Progress Stats
    interviews_completed = db.IntField(default=0)
    interviews_in_progress = db.IntField(default=0)
    average_score = db.FloatField(default=0.0)
    total_questions_answered = db.IntField(default=0)
    top_domains = db.ListField(db.StringField())
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': str(self.id),
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat(),
            'stats': {
                'completed': self.interviews_completed or 0,
                'in_progress': self.interviews_in_progress or 0,
                'avg_score': round(self.average_score or 0, 1),
                'total_questions': self.total_questions_answered or 0,
                'top_domains': self.top_domains or []
            }
        }
