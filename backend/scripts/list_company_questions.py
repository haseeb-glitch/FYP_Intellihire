import os
import sys
import mongoengine as db
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.config import Config
from backend.models.interview import CompanyQuestionBank

def list_questions(company=None):
    load_dotenv()
    db.connect(host=Config.MONGODB_SETTINGS['host'])
    
    query = {}
    if company:
        query['company_name'] = company
        
    questions = CompanyQuestionBank.objects(**query).all()
    
    print(f"\n{'='*80}")
    print(f"  COMPANY QUESTION BANK (Total: {len(questions)})")
    print(f"{'='*80}")
    
    current_company = ""
    for q in questions:
        if q.company_name != current_company:
            current_company = q.company_name
            print(f"\n--- {current_company} ---")
            
        print(f"[{q.category.upper()}] ({q.difficulty}) {q.question_text}")
        if q.role:
            print(f"   Role: {q.role} | Domain: {q.domain}")
        print("-" * 40)

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--company', type=str, help='Filter by company')
    args = parser.parse_args()
    
    list_questions(args.company)
