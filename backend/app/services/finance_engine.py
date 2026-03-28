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

# Keyword → (default_target, label)
GOAL_MAP = {
    "car":          (1_500_000, "New Car (₹15 lakh default)"),
    "bike":         (150_000,   "New Bike (₹1.5 lakh default)"),
    "iphone":       (80_000,    "iPhone"),
    "phone":        (30_000,    "Smartphone"),
    "laptop":       (80_000,    "Laptop"),
    "house":        (5_000_000, "House (₹50 lakh default)"),
    "flat":         (5_000_000, "Flat (₹50 lakh default)"),
    "vacation":     (200_000,   "Vacation (₹2 lakh default)"),
    "trip":         (100_000,   "Trip"),
    "wedding":      (1_000_000, "Wedding (₹10 lakh default)"),
    "education":    (500_000,   "Education"),
    "emergency":    (300_000,   "Emergency Fund (6-month default)"),
}

def detect_goal(message: str) -> Tuple[Optional[float], str]:
    """
    Returns (target_amount, label) or (None, "") if no goal detected.
    Tries to extract explicit amount first; falls back to keyword defaults.
    """
    msg_lower = message.lower()

    # Try extracting an explicit amount first
    explicit_amount = extract_amount_from_text(message)

    for keyword, (default_amount, label) in GOAL_MAP.items():
        if keyword in msg_lower:
            amount = explicit_amount if explicit_amount and explicit_amount > 1000 else default_amount
            return amount, label

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
    Returns None values for fields when data is unavailable.
    This dict is injected as STRICT TRUTH into the AI system prompt.
    """
    target, goal_label = detect_goal(message)
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
