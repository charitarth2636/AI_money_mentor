from app.models.financial import FinancialProfile

def calculate_health_score(profile: FinancialProfile) -> dict:
    """
    Calculates finding health score (0-100) based on 5 dimensions.
    """
    score = 0.0
    breakdown = {}
    
    # 1. Emergency Fund (20%) - 6 months of expenses
    target_emergency = profile.monthly_expenses * 6
    fund_ratio = min(profile.savings_emergency_fund / target_emergency, 1.0) if target_emergency > 0 else 1.0
    emergency_score = fund_ratio * 20
    score += emergency_score
    breakdown['emergency_fund'] = round(emergency_score, 2)
    
    # 2. Insurance Coverage (20%) - 10x term life, 5L health
    annual_income = profile.monthly_income * 12
    term_ratio = min(profile.term_insurance_coverage / (annual_income * 10), 1.0) if annual_income > 0 else 0
    health_ratio = min(profile.health_insurance_coverage / 500000, 1.0)
    insurance_score = ((term_ratio + health_ratio) / 2) * 20
    score += insurance_score
    breakdown['insurance_coverage'] = round(insurance_score, 2)
    
    # 3. Investment Ratio (30%) - 20% of total income
    total_investments = profile.direct_stocks + profile.mutual_funds + profile.real_estate + profile.physical_gold + profile.crypto + profile.business_value
    investment_ratio = min(total_investments / (annual_income * 2), 1.0) if annual_income > 0 else 0
    inv_score = investment_ratio * 30
    score += inv_score
    breakdown['investment_ratio'] = round(inv_score, 2)
    
    # 4. Debt-to-Income (20%)
    if annual_income > 0:
        total_debt = profile.home_loan + profile.vehicle_loan + profile.credit_card_dues + profile.personal_loans
        dti = total_debt / annual_income
        dti_score = max(0, (1.0 - dti)) * 20
    else:
        dti_score = 0
    score += dti_score
    breakdown['debt_to_income'] = round(dti_score, 2)
    
    # 5. Tax Efficiency (10%) - 1.5L
    tax_ratio = min(profile.tax_saving_investments / 150000, 1.0)
    tax_score = tax_ratio * 10
    score += tax_score
    breakdown['tax_efficiency'] = round(tax_score, 2)
    
    return {
        "total_score": round(score, 2),
        "breakdown": breakdown
    }
