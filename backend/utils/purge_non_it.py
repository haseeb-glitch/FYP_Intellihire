import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend import create_app, db
from backend.models.interview import QuestionBank
from backend.utils.constants import SUPPORTED_DOMAINS

def purge_non_it():
    app = create_app()
    with app.app_context():
        # Convert supported domains to slug format
        it_slugs = [d.lower().replace(" ", "_") for d in SUPPORTED_DOMAINS]
        it_slugs.append("general")
        it_slugs.append("General")
        
        count = 0
        for q in QuestionBank.objects:
            if q.domain not in it_slugs:
                q.delete()
                count += 1
        
        print(f"Purged {count} non-IT questions from the database.")

if __name__ == '__main__':
    purge_non_it()
