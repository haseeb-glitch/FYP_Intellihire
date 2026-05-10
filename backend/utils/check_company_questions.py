import sys
import os

# Add the parent directory to sys.path to allow importing backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend import create_app, db
from backend.models.interview import QuestionBank

def check_company_questions():
    app = create_app()
    with app.app_context():
        questions = QuestionBank.query.filter(QuestionBank.company_name.isnot(None)).all()
        if not questions:
            print("No company-specific questions found in database.")
        for q in questions:
            print(f"[{q.company_name}] ({q.domain}): {q.question_text}")

if __name__ == '__main__':
    check_company_questions()
