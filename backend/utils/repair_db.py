import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend import create_app
from backend.models.interview import InterviewSession, SessionQuestion
from backend.models.report import EvaluationScore
from backend.models.user import User

def repair_db():
    app = create_app()
    with app.app_context():
        user = User.objects.first()
        if not user:
            print("No user found to repair.")
            return
            
        print(f"Repairing stats for user: {user.username}")
        
        sessions = InterviewSession.objects(user=user).all()
        completed = sessions.filter(status='completed').count()
        in_progress = sessions.filter(status='in_progress').count()
        
        total_score = 0
        score_count = 0
        total_q = 0
        
        for s in sessions:
            eval_rec = EvaluationScore.objects(session=s).first()
            if eval_rec:
                total_score += eval_rec.final_score
                score_count += 1
            
            total_q += SessionQuestion.objects(session=s).count()

        user.interviews_completed = completed
        user.interviews_in_progress = in_progress
        user.average_score = (total_score / score_count) if score_count > 0 else 0
        user.total_questions_answered = total_q
        
        user.save()
        print("Database repair complete! Stats synchronized.")

if __name__ == '__main__':
    repair_db()
