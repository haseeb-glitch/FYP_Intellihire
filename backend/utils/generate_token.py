import sys
import os
import jwt
import datetime

# Add the parent directory to sys.path to allow importing backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend import create_app
from backend.models.user import User

def generate_token(username):
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(username=username).first()
        if user:
            token = jwt.encode({
                'user_id': user.id,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, app.config['JWT_SECRET_KEY'], algorithm="HS256")
            print(f"Token for {username}: {token}")
        else:
            print(f"User {username} not found.")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        generate_token(sys.argv[1])
    else:
        print("Please provide a username.")
