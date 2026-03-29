"""
Finance Engine - Deterministic Python Calculations
All math happens here. LLM only formats the result.
"""
import math
import re
from typing import Optional, Tuple


# ─────────────────────────────────────────
# INDIAN NUMBER HELPERS
# ─────────────────────────────────────────

def format_inr(amount: float) -> str:
    """Format a number in Indian currency notation (₹X lakh / ₹X crore)."""
    if amount >= 10_000_000:
        return f"₹{amount / 10_000_000:.1f} crore"
    elif amount >= 100_000:
        return f"₹{amount / 100_000:.1f} lakh"
    elif amount >= 1_000:
        return f"₹{amount:,.0f}"
    return f"₹{amount:.0f}"


def extract_amount_from_text(text: str) -> Optional[float]:
    """
    Safely extract a rupee amount from natural language.
    Supports: "15 lakh", "1.5 crore", "80000", "₹15,00,000"
    Returns None if no amount found.
    """
    text = text.lower().replace(",", "")

    # Match crore
    m = re.search(r"(\d+(?:\.\d+)?)\s*(crore|cr)", text)
    if m:
        return float(m.group(1)) * 10_000_000

    # Match lakh
    m = re.search(r"(\d+(?:\.\d+)?)\s*(lakh|lac|l\b)", text)
    if m:
        return float(m.group(1)) * 100_000

    # Match plain numbers ≥ 1000
    m = re.search(r"(\d{4,}(?:\.\d+)?)", text)
    if m:
        return float(m.group(1))

    return None


# ─────────────────────────────────────────
# GOAL DETECTION
# ─────────────────────────────────────────

# Keyword → Base Label
GOAL_MAP = {
    "car":          "Car",
    "bike":         "Bike",
    "iphone":       "iPhone",
    "phone":        "Smartphone",
    "laptop":       "Laptop",
    "house":        "House",
    "flat":         "Flat",
    "vacation":     "Vacation",
    "trip":         "Trip",
    "wedding":      "Wedding",
    "education":    "Education",
    "emergency":    "Emergency Fund",
}

def detect_goal(message: str, user_goals: list = []) -> Tuple[Optional[float], str]:
    """
    Returns (target_amount, label) or (None, "") if no goal detected.
    1. Checks if message matches an EXISTING user goal.
    2. Tries to extract explicit amount from message.
    3. NO more fake defaults — returns None if amount unknown.
    """
    msg_lower = message.lower()
    
    # 1. Check for matches against EXISTING user goals first
    for g in user_goals:
        title = g.get("title", "").lower()
        if title in msg_lower or any(kw in title for kw in msg_lower.split()):
            return g.get("target"), g.get("title")

    # 2. Try extracting an explicit amount from the text
    explicit_amount = extract_amount_from_text(message)

    for keyword, label in GOAL_MAP.items():
        if keyword in msg_lower:
            # If explicit amount exists, use it. Otherwise, return the label without a target.
            return explicit_amount, label

    # No keyword, but an amount was mentioned → generic goal
    if explicit_amount and explicit_amount > 1000:
        return explicit_amount, "Financial Goal"

    return None, ""


# ─────────────────────────────────────────
# CORE CALCULATION FUNCTIONS
# ─────────────────────────────────────────

def calculate_goal_timeline(
    target_amount: float,
    current_savings: float,
    monthly_investment: float
) -> Tuple[int, str]:
    """Returns (months_int, human_readable_string)."""
    if monthly_investment <= 0:
        return 9999, "Savings necessary. Please start a monthly investment."

    remaining = target_amount - current_savings
    if remaining <= 0:
        return 0, "Goal already achieved! 🎉"

    months = math.ceil(remaining / monthly_investment)
    years = round(months / 12, 1)

    if months <= 12:
        return months, f"{months} months"
    else:
        return months, f"{months} months (~{years} years)"


def calculate_required_savings(
    target_amount: float,
    current_savings: float,
    target_months: int
) -> float:
    """How much to save per month to hit goal in target_months."""
    remaining = target_amount - current_savings
    if remaining <= 0 or target_months <= 0:
        return 0.0
    return round(remaining / target_months, 2)


def calculate_emi(principal: float, annual_rate: float, months: int) -> float:
    """Standard EMI: P * r * (1+r)^n / ((1+r)^n - 1)."""
    if annual_rate == 0 or months == 0:
        return round(principal / max(months, 1), 2)
    r = annual_rate / (12 * 100)
    emi = principal * r * math.pow(1 + r, months) / (math.pow(1 + r, months) - 1)
    return round(emi, 2)


# ─────────────────────────────────────────
# FULL FINANCIAL BRIEF (used by AI Mentor)
# ─────────────────────────────────────────

def build_calculation_brief(message: str, surplus: float, profile: dict) -> dict:
    """
    Run all relevant calculations and return a dict of facts.
    """
    user_goals = profile.get("active_goals", [])
    target, goal_label = detect_goal(message, user_goals)
    
    brief = {
        "goal_label": goal_label or "General Advice",
        "target_amount": target,
        "target_fmt": format_inr(target) if target else None,
        "surplus_fmt": format_inr(max(surplus, 0)),
        "timeline_str": None,
        "months": None,
        "save_1yr_str": None,
        "save_2yr_str": None,
        "emi_5yr_str": None,
        "emi_3yr_str": None,
        "has_calc": False,
    }

    if target and surplus > 0:
        months, timeline_str = calculate_goal_timeline(target, 0, surplus)
        save_1yr = calculate_required_savings(target, 0, 12)
        save_2yr = calculate_required_savings(target, 0, 24)
        emi_5yr = calculate_emi(target * 0.8, 10, 60)   # 80% loan, 10% rate, 5 yr
        emi_3yr = calculate_emi(target * 0.8, 10, 36)   # 80% loan, 10% rate, 3 yr

        brief.update({
            "timeline_str": timeline_str,
            "months": months,
            "save_1yr_str": format_inr(save_1yr),
            "save_2yr_str": format_inr(save_2yr),
            "emi_5yr_str": format_inr(emi_5yr),
            "emi_3yr_str": format_inr(emi_3yr),
            "has_calc": True,
        })
    elif target and surplus <= 0:
        # No surplus but target known - show minimum savings needed
        save_1yr = calculate_required_savings(target, 0, 12)
        brief.update({
            "timeline_str": "Cannot calculate — no monthly surplus",
            "save_1yr_str": format_inr(save_1yr),
            "has_calc": True,
        })

    return brief
