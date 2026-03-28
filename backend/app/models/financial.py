from pydantic import BaseModel, Field

class FinancialProfile(BaseModel):
    age: int = Field(25, description="Your current age in years")
    monthly_income: float = Field(0.0, description="Total monthly income in INR")
    monthly_expenses: float = Field(0.0, description="Total monthly expenses in INR")
    health_insurance_coverage: float = Field(0.0, description="Total SUM INSURED for Health Insurance (NOT the premium)")
    term_insurance_coverage: float = Field(0.0, description="Total SUM INSURED for Term Life Insurance (NOT the premium)")
    # Assets
    direct_stocks: float = Field(0.0)
    mutual_funds: float = Field(0.0)
    real_estate: float = Field(0.0)
    physical_gold: float = Field(0.0)
    crypto: float = Field(0.0)
    business_value: float = Field(0.0)
    savings_emergency_fund: float = Field(0.0)
    
    # Liabilities
    home_loan: float = Field(0.0)
    vehicle_loan: float = Field(0.0)
    credit_card_dues: float = Field(0.0)
    personal_loans: float = Field(0.0)
    
    # Others
    tax_saving_investments: float = Field(0.0)
    risk_tolerance: str = Field("medium", description="Risk appetite: low, medium, or high")
    financial_goals: list = Field([], description="List of financial goals")
    existing_investments: list = Field([], description="Automatically populated by PDF statement uploads")
    full_name: str = Field(None, description="User's full name")

class FinancialProfileInDB(FinancialProfile):
    user_id: str = Field(...)
