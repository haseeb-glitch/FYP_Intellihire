import requests
import json

url = "http://localhost:5000/api/admin/users"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJleHAiOjE3NzcyOTk1MjV9.I4nXcTGCgvoXOQcbjY1CBDgL9tNU8MClAEQCPUfqmi0"

headers = {
    "Authorization": f"Bearer {token}"
}

try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
