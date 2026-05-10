import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend import create_app
from backend.models.interview import InterviewSession, SessionQuestion
from backend.models.report import EvaluationScore
from backend.models.user import User

def debug_db():
    app = create_app()
    with app.app_context():
        print(f"Total Users: {User.objects.count()}")
        print(f"Total Sessions: {InterviewSession.objects.count()}")
        print(f"Total Questions: {SessionQuestion.objects.count()}")
        print(f"Total Evaluations: {EvaluationScore.objects.count()}")
        
        print("\nLast 5 Sessions:")
        for s in InterviewSession.objects.order_by('-started_at').limit(5):
            eval_exists = EvaluationScore.objects(session=s).first() is not None
            print(f"ID: {s.id} | Status: {s.status} | User: {s.user.id if s.user else 'None'} | Eval: {eval_exists}")

if __name__ == '__main__':
    debug_db()
