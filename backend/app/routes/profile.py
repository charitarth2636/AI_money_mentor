from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.models.financial import FinancialProfile
from app.core.database import get_database
from app.core.security import get_current_user
from app.services.health_score import calculate_health_score

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
    
    return {
        "status": "success",
        "data": profile_dict
    }

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
    
    # Use timezone-aware UTC now for consistency
    now = datetime.now(timezone.utc)

    for i in range(5, -1, -1):
        # Calculate month start and end properly
        # Logic to handle year change
        month_start = (now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i * 30)).replace(day=1)
        next_month = (month_start.replace(month=month_start.month % 12 + 1, day=1) 
                     if month_start.month < 12 
                     else month_start.replace(year=month_start.year + 1, month=1, day=1))

        # Query income for this month
        pipeline_income = [
            {"$match": {"user_id": user_id, "type": "income", "date": {"$gte": month_start, "$lt": next_month}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        # Query expense for this month
        pipeline_expense = [
            {"$match": {"user_id": user_id, "type": "expense", "date": {"$gte": month_start, "$lt": next_month}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]

        income_res = await db["transactions"].aggregate(pipeline_income).to_list(1)
        expense_res = await db["transactions"].aggregate(pipeline_expense).to_list(1)

        months_list.append(month_start.strftime("%b"))
        income_list.append(income_res[0]["total"] if income_res else 0)
        expense_list.append(expense_res[0]["total"] if expense_res else 0)

    return {
        "status": "success", 
        "data": {
            "income": income_list,
            "expenses": expense_list,
            "months": months_list
        }
    }
