from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.models.financial import FinancialProfile
from app.core.database import get_database
from app.core.security import get_current_user
from app.services.health_score import calculate_health_score
from datetime import datetime, timezone, timedelta

router = APIRouter()

@router.post("/profile", status_code=status.HTTP_201_CREATED)
async def create_profile(profile: FinancialProfile, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    db = get_database()
    
    profile_dict = profile.model_dump()
    profile_dict["user_id"] = user_id
    
    # If full_name is provided, update it in the users collection
    if profile.full_name:
        await db["users"].update_one(
            {"_id": current_user["_id"]},
            {"$set": {"full_name": profile.full_name}}
        )
    
    # Remove full_name from profile_dict before saving to user_profiles to avoid redundancy
    # (Optional, but cleaner as it's already in users collection)
    profile_dict.pop("full_name", None)

    # Save or update profile by User ID
    await db["user_profiles"].update_one(
        {"user_id": user_id},
        {"$set": profile_dict},
        upsert=True
    )
    
    # Mark user's profile_completed status
    await db["users"].update_one(
        {"_id": current_user["_id"]},
        {"$set": {"profile_completed": True}}
    )
    
    # ── SINGLE SOURCE OF TRUTH: SYNC ONBOARDING → TRANSACTIONS & GOALS ──
    await sync_onboarding_data(db, user_id, profile)
    
    return {
        "status": "success",
        "data": profile_dict
    }

async def sync_onboarding_data(db, user_id: str, profile: FinancialProfile):
    """
    Converts onboarding data into 'Synthetic Transactions' and 'Auto Goals'.
    Ensures idempotency by updating existing onboarding entries.
    """
    now = datetime.now(timezone.utc)
    
    # 1. SYNTHETIC TRANSACTIONS
    onboarding_txs = [
        {
            "user_id": user_id,
            "amount": profile.monthly_income,
            "category": "Salary/Onboarding",
            "description": "Initial Onboarding Income",
            "type": "income",
            "source": "onboarding",
            "date": now
        },
        {
            "user_id": user_id,
            "amount": profile.monthly_expenses,
            "category": "Monthly Expenses/Onboarding",
            "description": "Initial Onboarding Expenses",
            "type": "expense",
            "source": "onboarding",
            "date": now
        },
        {
            "user_id": user_id,
            "amount": profile.savings_emergency_fund,
            "category": "Initial Balance",
            "description": "Savings/Emergency Fund Balance",
            "type": "income",
            "source": "onboarding",
            "date": now
        }
    ]

    for tx in onboarding_txs:
        # Match by user_id, category, and source=onboarding to update instead of duplicate
        await db["transactions"].update_one(
            {"user_id": user_id, "category": tx["category"], "source": "onboarding"},
            {"$set": tx},
            upsert=True
        )

    # 2. AUTO-GENERATED GOALS
    # Goal 1: Emergency Fund (6 months of expenses)
    ef_target = max(6 * profile.monthly_expenses, 10000) # Min 10k
    ef_goal = {
        "user_id": user_id,
        "title": "Emergency Fund (Auto)",
        "target": ef_target,
        "current": profile.savings_emergency_fund,
        "source": "onboarding"
    }
    
    # Goal 2: Wealth Growth Goal
    wg_goal = {
        "user_id": user_id,
        "title": "Wealth Building (Auto)",
        "target": max(profile.savings_emergency_fund * 1.5, 50000),
        "current": profile.savings_emergency_fund,
        "source": "onboarding"
    }

    for goal in [ef_goal, wg_goal]:
        await db["goals"].update_one(
            {"user_id": user_id, "title": goal["title"], "source": "onboarding"},
            {"$set": goal},
            upsert=True
        )

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    db = get_database()
    
    profile_data = await db["user_profiles"].find_one({"user_id": user_id})
    if not profile_data:
        # Return a zero-state generic profile instead of 404 to avoid frontend looping
        profile_data = {
            "monthly_income": 0,
            "monthly_expenses": 0,
            "savings_emergency_fund": 0,
            "mutual_funds_stocks": 0,
            "total_debt": 0,
            "existing_investments": [],
            "risk_tolerance": "medium",
            "financial_goals": []
        }
    else:
        # Remove MongoDB internal ObjectId safely for JSON parsing
        profile_data.pop("_id", None)
    
    # Fetch full_name from users collection
    user = await db["users"].find_one({"_id": current_user["_id"]})
    profile_data["full_name"] = user.get("full_name", "User")
    
    return {
        "status": "success",
        "data": profile_data
    }

@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    db = get_database()

    # ── 1. Base profile ──────────────────────────────────────────
    profile_data = await db["user_profiles"].find_one({"user_id": user_id})
    if not profile_data:
        return {
            "status": "success",
            "data": {
                "health_score": 0,
                "dimensions_breakdown": {},
                "goal_progress": "Please complete your profile to generate a health score.",
                "monthly_income":   0,
                "monthly_expenses": 0,
                "surplus":          0,
                "transaction_income":  0,
                "transaction_expense": 0,
                "category_breakdown":  {},
                "goals_count": 0,
            }
        }

    # ── 2. Real transaction aggregates ──────────────────────────
    from app.routes.transactions import get_transaction_summary
    tx_summary = await get_transaction_summary(db, user_id)

    # ── 3. Decide effective income & expense ─────────────────────
    # Priority: use transaction totals if they exist, else profile values
    profile_income   = profile_data.get("monthly_income",   0)
    profile_expenses = profile_data.get("monthly_expenses", 0)

    # Transaction totals are lifetime totals; derive monthly avg (last 30d)
    from datetime import datetime, timedelta, timezone
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    pipeline_30d = [
        {"$match": {"user_id": user_id, "date": {"$gte": thirty_days_ago}}},
        {"$group": {"_id": "$type", "total": {"$sum": "$amount"}}}
    ]
    recent_results = await db["transactions"].aggregate(pipeline_30d).to_list(None)
    recent = {r["_id"]: r["total"] for r in recent_results}

    tx_income_30d  = recent.get("income",  0)
    tx_expense_30d = recent.get("expense", 0)

    # Use whichever is non-zero and more specific
    effective_income   = tx_income_30d  if tx_income_30d  > 0 else profile_income
    effective_expenses = tx_expense_30d if tx_expense_30d > 0 else profile_expenses
    surplus = max(effective_income - effective_expenses, 0)

    # ── 4. Health score ──────────────────────────────────────────
    try:
        # Patch profile_data with effective values for health calc
        profile_for_score = dict(profile_data)
        profile_for_score["monthly_income"]   = effective_income
        profile_for_score["monthly_expenses"] = effective_expenses
        profile_model  = FinancialProfile(**profile_for_score)
        health_data    = calculate_health_score(profile_model)
        health_score   = health_data["total_score"]
        breakdown      = health_data["breakdown"]
    except Exception:
        health_score = 0
        breakdown    = {}

    # ── 5. Goals count ───────────────────────────────────────────
    goals_count = await db["goals"].count_documents({"user_id": user_id})

    return {
        "status": "success",
        "data": {
            # Health
            "health_score":         health_score,
            "dimensions_breakdown": breakdown,
            "goal_progress": f"Financial Health: {health_score}% — {goals_count} active goal(s).",

            # Real financials
            "monthly_income":   effective_income,
            "monthly_expenses": effective_expenses,
            "surplus":          round(surplus, 2),

            # Raw transaction aggregates (lifetime)
            "transaction_income":  tx_summary["total_income"],
            "transaction_expense": tx_summary["total_expense"],
            "net_balance":         tx_summary["net_balance"],
            "category_breakdown":  tx_summary["category_totals"],

            # Counts
            "goals_count": goals_count,
        }
    }

@router.get("/cashflow")
async def get_cashflow(current_user: dict = Depends(get_current_user)):
    """Returns last 6 months of absolute cashflow data as separate arrays."""
    from datetime import datetime, timedelta, timezone
    user_id = str(current_user["_id"])
    db = get_database()

    # Define return data structure
    months_list = []
    income_list = []
    expense_list = []
    
    now = datetime.now(timezone.utc)
    # Start from the current month
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    for i in range(5, -1, -1):
        # Calculate month offset manually to avoid timedelta(days=30) issues
        # Offset target_month: current_month - i months
        target_year = current_month_start.year
        target_month = current_month_start.month - i
        
        while target_month <= 0:
            target_month += 12
            target_year -= 1
            
        month_start = datetime(target_year, target_month, 1, tzinfo=timezone.utc)
        
        # Calculate next_month for the boundary
        if target_month == 12:
            next_month = datetime(target_year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            next_month = datetime(target_year, target_month + 1, 1, tzinfo=timezone.utc)

        # Aggregation pipelines for Income & Expense
        pipeline_income = [
            {"$match": {"user_id": user_id, "type": "income", "date": {"$gte": month_start, "$lt": next_month}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        pipeline_expense = [
            {"$match": {"user_id": user_id, "type": "expense", "date": {"$gte": month_start, "$lt": next_month}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]

        income_res = await db["transactions"].aggregate(pipeline_income).to_list(1)
        expense_res = await db["transactions"].aggregate(pipeline_expense).to_list(1)

        months_list.append(month_start.strftime("%b"))
        income_list.append(income_res[0]["total"] if income_res else 0.0)
        expense_list.append(expense_res[0]["total"] if expense_res else 0.0)

    return {
        "status": "success", 
        "data": {
            "income": income_list,
            "expenses": expense_list,
            "months": months_list
        }
    }
