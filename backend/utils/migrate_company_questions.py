import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend import create_app
from backend.models.interview import QuestionBank, CompanyQuestionBank

def migrate_company_questions():
    """
    Moves all questions with a company_name from QuestionBank to CompanyQuestionBank.
    """
    app = create_app()
    with app.app_context():
        print("Starting migration of company questions...")
        
        # Find all questions in the old bank that have a company_name
        questions = QuestionBank.objects(company_name__ne=None).all()
        print(f"Found {len(questions)} questions to migrate.")
        
        migrated_count = 0
        skipped_count = 0
        
        for q in questions:
            # Check if it already exists in the new bank
            exists = CompanyQuestionBank.objects(
                company_name=q.company_name,
                question_text=q.question_text
            ).first()
            
            if exists:
                skipped_count += 1
                continue
                
            # Create new record
            new_q = CompanyQuestionBank(
                company_name=q.company_name,
                role="Software Engineer", # Default for old questions
                domain=q.domain,
                category=q.category,
                difficulty=q.difficulty,
                question_text=q.question_text,
                subtype=q.subtype or 'migrated',
                created_at=q.created_at or datetime.utcnow()
            )
            new_q.save()
            migrated_count += 1
            
        print(f"Migration complete: {migrated_count} moved, {skipped_count} skipped (already existed).")
        
        # Optional: Ask user if they want to delete from old table
        # For now, let's just keep them as backup unless user asks to delete.

if __name__ == "__main__":
    migrate_company_questions()
