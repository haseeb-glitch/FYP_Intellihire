import sys
import os

# Add the parent directory to sys.path to allow importing backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend import create_app, db
from backend.models.user import User

def list_users():
    app = create_app()
    with app.app_context():
        users = User.query.all()
        if not users:
            print("No users found in database.")
        for user in users:
            print(f"ID: {user.id}, Username: {user.username}, Email: {user.email}, Admin: {user.is_admin}")

if __name__ == '__main__':
    list_users()
