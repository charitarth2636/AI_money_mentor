import requests
import json
import uuid

base_url = "http://localhost:8000/api"

def print_res(response):
    print(f"Status Code: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    print()

# Use unique email to avoid "already registered" on multiple rapid runs
test_email = f"test_{uuid.uuid4().hex[:6]}@example.com"

print("--- 1. REGISTER ---")
register_res = requests.post(
    f"{base_url}/auth/register",
    json={"email": test_email, "password": "password123"}
)
print_res(register_res)

print("--- 2. LOGIN ---")
login_res = requests.post(
    f"{base_url}/auth/login",
    json={"email": test_email, "password": "password123"}
)
print_res(login_res)

token = None
if login_res.status_code == 200:
    token = login_res.json()["access_token"]
else:
    print("Login failed, aborting tests.")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

print("--- 3. CREATE PROFILE ---")
profile_data = {
    "age": 30,
    "monthly_income": 100000,
    "monthly_expenses": 40000,
    "health_insurance_coverage": 500000,
    "term_insurance_coverage": 10000000,
    "mutual_funds_stocks": 250000,
    "savings_emergency_fund": 200000,
    "total_debt": 500000,
    "tax_saving_investments": 100000
}
profile_res = requests.post(
    f"{base_url}/profile",
    json=profile_data,
    headers=headers
)
print_res(profile_res)

print("--- 4. GET DASHBOARD ---")
dash_res = requests.get(
    f"{base_url}/dashboard",
    headers=headers
)
print_res(dash_res)

print("--- 5. POST CHAT ---")
chat_res = requests.post(
    f"{base_url}/chat",
    headers=headers,
    json={"message": "Hello mentor, what should I do with my finances?"}
)
print_res(chat_res)
