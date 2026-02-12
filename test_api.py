import requests
import json

BASE_URL = "http://127.0.0.1:5000/api"

def test_login(username, password, role):
    url = f"{BASE_URL}/login"
    payload = {
        "username": username,
        "password": password,
        "role": role
    }
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Login for {username} as {role}: Status {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 200:
            return True
    except Exception as e:
        print(f"Error: {e}")
        return False

print("--- Testing User Login ---")
test_login("user1", "password123", "user")

print("\n--- Testing Admin Login ---")
test_login("admin", "admin123", "admin")

print("\n--- Testing Invalid Login ---")
test_login("user1", "wrongpassword", "user")
