import sys
import os

# Add the parent directory to sys.path to allow importing backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend import create_app, db
from backend.models.interview import QuestionBank

def check_counts():
    app = create_app()
    with app.app_context():
        # Total count
        total = QuestionBank.objects.count()
        print(f"Total Questions: {total}")
        
        # Count per domain using MongoEngine aggregation
        pipeline = [
            {"$group": {"_id": "$domain", "count": {"$sum": 1}}}
        ]
        counts = QuestionBank.objects.aggregate(pipeline)
        
        print("\nQuestions per domain:")
        for entry in counts:
            print(f"- {entry['_id'] or 'General'}: {entry['count']}")


if __name__ == '__main__':
    check_counts()
