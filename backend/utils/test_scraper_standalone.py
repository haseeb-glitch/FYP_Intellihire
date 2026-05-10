import os
import sys
from dotenv import load_dotenv

# Add the parent directory to sys.path to allow importing backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

load_dotenv()

from backend.agents.agents import scraper_agent
from backend import create_app, db
from backend.models.interview import QuestionBank

def test_scraper():
    company = "Netflix"
    role = "Software Engineer"
    domain = "software_engineer"
    print(f"Testing scraper for {company} {role}...")
    
    questions = scraper_agent.fetch_company_questions(company, role)
    print(f"Found {len(questions)} questions:")
    for i, q in enumerate(questions):
        print(f"{i+1}. {q}")
        
    if questions:
        app = create_app()
        with app.app_context():
            for q_text in questions:
                new_q = QuestionBank(
                    category='technical',
                    domain=domain,
                    difficulty='medium',
                    question_text=q_text,
                    company_name=company
                )
                db.session.add(new_q)
            db.session.commit()
            print("Successfully saved to database.")

if __name__ == '__main__':
    test_scraper()
