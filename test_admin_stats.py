import requests

url = "http://localhost:5000/api/admin/stats"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJleHAiOjE3NzcyOTk1MjV9.I4nXcTGCgvoXOQcbjY1CBDgL9tNU8MClAEQCPUfqmi0"

headers = {
    "Authorization": f"Bearer {token}"
}

try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
