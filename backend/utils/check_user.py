import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend import create_app
from backend.models.interview import InterviewSession
from backend.models.report import EvaluationScore
from backend.models.user import User

def debug_user_stats():
    app = create_app()
    with app.app_context():
        user = User.objects.first()
        if user:
            print(f"User: {user.username} (ID: {user.id})")
            print(f"Stats: {user.to_dict().get('stats')}")
            
            sessions = InterviewSession.objects(user=user).all()
            print(f"Sessions for this user: {len(sessions)}")
            for s in sessions:
                print(f"  - Session {s.id} Status: {s.status}")
        else:
            print("No users found in database.")

if __name__ == '__main__':
    debug_user_stats()
