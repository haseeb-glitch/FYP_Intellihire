import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend import create_app
from backend.models.interview import InterviewSession, SessionQuestion
from backend.models.report import EvaluationScore

def check_last_session_details():
    app = create_app()
    with app.app_context():
        last_session = InterviewSession.objects.order_by('-started_at').first()
        if not last_session:
            print("No sessions found.")
            return
            
        print(f"Session ID: {last_session.id} | Status: {last_session.status}")
        
        questions = SessionQuestion.objects(session=last_session).all()
        print(f"Questions found: {len(questions)}")
        
        for q in questions:
            print(f"  - Q: {q.question_text[:30]}...")
            print(f"    Scores: {q.question_scores}")
            print(f"    Transcript: {q.transcript[:30] if q.transcript else 'None'}...")

        evaluation = EvaluationScore.objects(session=last_session).first()
        if evaluation:
            print(f"\nEvaluation found!")
            print(f"Final Score: {evaluation.final_score}")
            print(f"HR: {evaluation.hr_overall} | Tech: {evaluation.technical_overall} | Stress: {evaluation.stress_overall}")
        else:
            print("\nNO EVALUATION RECORD FOUND.")

if __name__ == '__main__':
    check_last_session_details()
