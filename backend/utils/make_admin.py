import sys
import os

# Add the parent directory to sys.path to allow importing backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend import create_app, db
from backend.models.user import User

def make_admin(username):
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(username=username).first()
        if user:
            user.is_admin = True
            db.session.commit()
            print(f"User {username} is now an admin.")
        else:
            print(f"User {username} not found.")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        make_admin(sys.argv[1])
    else:
        print("Please provide a username.")
