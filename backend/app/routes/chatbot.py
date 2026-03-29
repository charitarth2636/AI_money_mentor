from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from typing import Optional
from app.core.database import get_database
from app.core.security import get_current_user
from app.models.chat import ChatRequest, ChatResponse
from app.services.ai_mentor import (
    get_ai_reply, 
    detect_language, 
    analyze_intent, 
    requires_confirmation,
    update_conversation_context,
    get_conversation_context
)
from app.services.action_executor import execute_action

router = APIRouter()


async def _build_enriched_profile(db, user_id: str, current_user: dict) -> Optional[dict]:
    """
    Merge profile + real transaction aggregates into one dict for AI.
    This is the SINGLE SOURCE OF TRUTH passed to the AI mentor.
    """
    from app.routes.transactions import get_transaction_summary

    if not user_id:
        return None

    profile_data = await db["user_profiles"].find_one({"user_id": user_id})
    if not profile_data:
        # Return an empty but structured dict if profile is completely missing
        return {
            "status": "missing_profile",
            "monthly_income": 0,
            "monthly_expenses": 0,
            "active_goals": []
        }

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
    
    # Strictly use top categories — if empty, the AI will handle it
    profile_dict["tx_category_totals"] = tx_summary["category_totals"]

    # ── Fetch 10 most recent transactions ─────────────────────────
    recent_tx_cursor = db["transactions"].find({"user_id": user_id}).sort("date", -1).limit(10)
    recent_txs = []
    async for t in recent_tx_cursor:
        recent_txs.append({
            "amount":   t.get("amount", 0),
            "category": t.get("category", "Other"),
            "type":     t.get("type", "expense"),
            "date":     t.get("date").strftime("%d %b") if t.get("date") else "Unknown",
            "desc":     t.get("description", "")
        })
    profile_dict["recent_transactions"] = recent_txs

    # ── Inject real goals data (titles + targets + current) ───────
    goals_cursor = db["goals"].find({"user_id": user_id})
    goals_list = []
    async for g in goals_cursor:
        target  = g.get("target", 0)
        current = g.get("current", 0)
        goals_list.append({
            "title":        g.get("title", ""),
            "target":       target,
            "current":      current,
            "is_completed": current >= target if target > 0 else False,
            "source":       g.get("source", "manual")
        })
    
    profile_dict["active_goals"] = goals_list
    profile_dict["active_goals_count"] = len(goals_list)
    profile_dict["status"] = "complete"

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

    # 1. Fetch History & Context
    history_cursor = db["chat_history"].find({"user_id": user_id}).sort("timestamp", -1).limit(6)
    history_docs = await history_cursor.to_list(length=6)
    history_docs.reverse()
    
    ctx = await get_conversation_context(db, user_id)
    pending = ctx.get("pending_action")

    # 2. Analyze Intent
    intent = await analyze_intent(request.message, history_docs)
    action = intent.get("action")
    
    action_summary = ""

    # 3. Confirmation Layer & Execution
    if action == "CONFIRM" and pending:
        # EXECUTE the saved pending action
        result = await execute_action(user_id, pending)
        action_summary = result["message"] if result["success"] else f"Error: {result['message']}"
        # Clear pending
        await update_conversation_context(db, user_id, {"pending_action": None})
    
    elif action == "CONFIRM" and not pending:
        action_summary = "User confirmed, but no pending action found."

    elif action != "QUERY" and action != "CONFIRM":
        # New potential action
        if requires_confirmation(intent):
            # SAVE to context, do NOT execute yet
            await update_conversation_context(db, user_id, {"pending_action": intent})
            action_summary = "NEEDS_CONFIRMATION"
        else:
            # EXECUTE immediately
            result = await execute_action(user_id, intent)
            action_summary = result["message"] if result["success"] else f"Error: {result['message']}"

    # 4. Refresh Profile Data (so AI sees the changes)
    profile_dict = await _build_enriched_profile(db, user_id, current_user)
    
    if not profile_dict:
        # (Handling missing profile as before...)
        return ChatResponse(status="success", reply="Profile missing. Please set it up.")

    # 5. Final Grounded Response
    try:
        ai_reply = await get_ai_reply(user_id, request.message, profile_dict, action_summary)
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
