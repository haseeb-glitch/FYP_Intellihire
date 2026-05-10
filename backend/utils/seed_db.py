import json
import os
import sys

# Add the parent directory to sys.path to allow importing backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend import create_app, db
from backend.models.interview import QuestionBank

def seed_questions():
    app = create_app()
    with app.app_context():
        # Clear existing questions if any
        # QuestionBank.objects.delete()
        
        question_banks_dir = app.config['QUESTION_BANKS_DIR']
        
        # Mapping for special files
        special_files = {
            'hr_questions.json': ('hr', None),
            'technical_questions.json': ('technical', None),
            'stress_questions.json': ('stress', None)
        }
        
        count = 0
        for filename in os.listdir(question_banks_dir):
            if not filename.endswith('.json'):
                continue
                
            file_path = os.path.join(question_banks_dir, filename)
            
            with open(file_path, 'r') as f:
                data = json.load(f)
                questions_dict = data.get('questions', {})
                
                # Determine category and domain
                if filename in special_files:
                    category, domain = special_files[filename]
                else:
                    category = 'technical' # Default for domain files
                    domain = filename.replace('.json', '')
                
                for difficulty, questions in questions_dict.items():
                    for q in questions:
                        # Check if question already exists to avoid duplicates
                        existing = QuestionBank.objects(
                            question_text=q['question'],
                            domain=domain,
                            category=category or q.get('type')
                        ).first()
                        
                        if not existing:
                            new_q = QuestionBank(
                                category=category or q.get('type', 'technical'),
                                domain=domain,
                                difficulty=difficulty,
                                question_text=q['question'],
                                question_type=q.get('type'),
                                subtype=q.get('subtype'),
                                requires_code=q.get('requires_code', False)
                            )
                            new_q.save()
                            count += 1
        
        # No session.commit() needed for MongoEngine
        pass
        print(f"Successfully seeded {count} questions into the database.")

if __name__ == '__main__':
    seed_questions()
