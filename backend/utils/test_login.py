import requests

def test_login():
    url = "http://localhost:5000/api/auth/login"
    payload = {
        "username": "Afra",
        "password": "password123" # I'll assume this is what the user used
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Body: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_login()
