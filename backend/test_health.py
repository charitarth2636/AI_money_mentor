import sys
import os
sys.path.append(os.path.abspath('d:/projects/AI_money_mentor'))

from app.models.financial import FinancialProfile
from app.services.health_score import calculate_health_score

profile = FinancialProfile(
    age=30,
    monthly_income=100000,
    monthly_expenses=40000,
    health_insurance_coverage=500000,
    term_insurance_coverage=1000000,
    mutual_funds_stocks=200000,
    savings_emergency_fund=100000,
    total_debt=50000,
    tax_saving_investments=150000
)

try:
    res = calculate_health_score(profile)
    print("SUCCESS:")
    print(res)
except Exception as e:
    print("ERROR:", e)
