import requests
import json

# Replace with a valid admin token from your previous testing
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJleHAiOjE3NzcyOTk1MjV9.I4nXcTGCgvoXOQcbjY1CBDgL9tNU8MClAEQCPUfqmi0"

url = "http://localhost:5000/api/interview/start"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

setup_data = {
    "domain": "Software Engineer",
    "company_name": "Netflix",
    "job_role": "Backend Engineer",
    "difficulty": "medium",
    "interview_mode": "mixed",
    "answer_mode": "text"
}

print(f"Testing 2-layer system for: {setup_data['company_name']} {setup_data['job_role']}")

try:
    response = requests.post(url, headers=headers, json=setup_data)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    
    if response.status_code == 201:
        print("\nSUCCESS! Interview Started.")
        session_id = result.get('session_id')
        print(f"Session ID: {session_id}")
        
        # Now fetch all questions for this session to verify mixing
        questions_url = f"http://localhost:5000/api/interview/session/{session_id}"
        q_response = requests.get(questions_url, headers=headers)
        if q_response.status_code == 200:
            session_data = q_response.json()
            all_questions = session_data.get('questions', [])
            print("\nQuestions in this session (Mixing Test):")
            for q in all_questions:
                q_type = q.get('question_subtype', 'general')
                print(f"[{q_type.upper()}] Q: {q.get('question_text')}")
        else:
            print(f"Could not fetch questions: {q_response.text}")
    else:
        print(f"Error: {result}")

except Exception as e:
    print(f"Test Error: {e}")
