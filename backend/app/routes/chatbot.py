from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from typing import Optional
from app.core.database import get_database
from app.core.security import get_current_user
from app.models.chat import ChatRequest, ChatResponse
from app.services.ai_mentor import get_ai_reply, detect_language

router = APIRouter()


async def _build_enriched_profile(db, user_id: str, current_user: dict) -> Optional[dict]:
    """
    Merge profile + real transaction aggregates into one dict for AI.
    This is the SINGLE SOURCE OF TRUTH passed to the AI mentor.
    """
    from app.routes.transactions import get_transaction_summary

    profile_data = await db["user_profiles"].find_one({"user_id": user_id})
    if not profile_data:
        return None

    profile_dict = {k: v for k, v in profile_data.items() if k != "_id"}

    # Inject real name
    user = await db["users"].find_one({"_id": current_user["_id"]})
    profile_dict["full_name"] = user.get("full_name", "") if user else ""

    # ── Inject real transaction data ──────────────────────────────
    tx_summary = await get_transaction_summary(db, user_id)

    # Last 30-day totals (more relevant for monthly context)
    from datetime import timedelta
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    pipeline_30d = [
        {"$match": {"user_id": user_id, "date": {"$gte": thirty_days_ago}}},
        {"$group": {"_id": "$type", "total": {"$sum": "$amount"}}}
    ]
    recent_results = await db["transactions"].aggregate(pipeline_30d).to_list(None)
    recent = {r["_id"]: r["total"] for r in recent_results}

    tx_income_30d  = recent.get("income",  0)
    tx_expense_30d = recent.get("expense", 0)

    # Override profile values with real transaction data when available
    if tx_income_30d > 0:
        profile_dict["monthly_income"] = tx_income_30d
    if tx_expense_30d > 0:
        profile_dict["monthly_expenses"] = tx_expense_30d

    # Inject transaction summary as extra context for the AI
    profile_dict["tx_total_income"]    = tx_summary["total_income"]
    profile_dict["tx_total_expense"]   = tx_summary["total_expense"]
    profile_dict["tx_net_balance"]     = tx_summary["net_balance"]
    profile_dict["tx_category_totals"] = tx_summary["category_totals"]

    # Goals count
    goals_count = await db["goals"].count_documents({"user_id": user_id})
    profile_dict["active_goals_count"] = goals_count

    return profile_dict


# ── POST /chat ─────────────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def chat_with_mentor(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    db = get_database()

    lang = detect_language(request.message)

    # Build enriched profile (real data, single source of truth)
    profile_dict = await _build_enriched_profile(db, user_id, current_user)

    if not profile_dict:
        if lang == "hinglish":
            ai_reply = (
                "Namaste! 🙏 Aapka profile abhi setup nahi hua hai.\n\n"
                "👉 **Profile** section mein jaake apna income aur expenses add karein — "
                "toh main aapke liye ek real financial plan bana sakta hun!"
            )
        else:
            ai_reply = (
                "Hello! 🙏 Your financial profile hasn't been set up yet.\n\n"
                "👉 Please go to the **Profile** section and add your income & expenses — "
                "then I can build a real, personalized plan for you!"
            )
        return ChatResponse(status="success", reply=ai_reply)

    try:
        ai_reply = await get_ai_reply(user_id, request.message, profile_dict)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI mentor error: {str(e)}"
        )

    # Save chat history
    await db["chat_history"].insert_one({
        "user_id":   user_id,
        "user_msg":  request.message,
        "ai_reply":  ai_reply,
        "timestamp": datetime.now(timezone.utc),
    })

    return ChatResponse(status="success", reply=ai_reply)


# ── GET /chat_history ──────────────────────────────────────────────
@router.get("/chat_history")
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    """Returns last 50 chat messages for this user, oldest first."""
    user_id = str(current_user["_id"])
    db = get_database()

    cursor = db["chat_history"].find({"user_id": user_id}).sort("timestamp", 1).limit(50)
    history = []
    async for doc in cursor:
        ts = doc.get("timestamp")
        history.append({
            "user_msg":  doc.get("user_msg", ""),
            "ai_reply":  doc.get("ai_reply", ""),
            "timestamp": ts.replace(tzinfo=timezone.utc).isoformat() if ts else "",
        })
    return {"status": "success", "data": history}
