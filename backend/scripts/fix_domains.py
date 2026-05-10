import os
import sys
import mongoengine as db
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.config import Config
from backend.models.interview import CompanyQuestionBank

def fix_domains():
    load_dotenv()
    db.connect(host=Config.MONGODB_SETTINGS['host'])
    
    # Update questions where role is 'ML Engineer'
    updated = CompanyQuestionBank.objects(
        role='ML Engineer'
    ).update(set__domain='ml_engineer')
    
    print(f"Updated {updated} questions to 'ml_engineer' domain.")

if __name__ == '__main__':
    fix_domains()
