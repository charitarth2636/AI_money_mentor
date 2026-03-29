from typing import Optional, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_database

async def execute_action(user_id: str, intent_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes a structured intent against the database.
    Returns: {"success": bool, "message": str, "data": dict}
    """
    db = get_database()
    action = intent_data.get("action")
    params = intent_data.get("params", {})

    try:
        if action == "ADD_TRANSACTION":
            return await _add_transaction(db, user_id, params)
        elif action == "DELETE_TRANSACTION":
            return await _delete_transaction(db, user_id, params)
        elif action == "ADD_GOAL":
            return await _add_goal(db, user_id, params)
        elif action == "UPDATE_GOAL":
            return await _update_goal(db, user_id, params)
        else:
            return {"success": False, "message": f"Unknown action: {action}"}
    except Exception as e:
        return {"success": False, "message": f"Execution error: {str(e)}"}

async def _add_transaction(db, user_id: str, params: Dict[str, Any]):
    tx_dict = {
        "user_id": user_id,
        "amount": float(params.get("amount", 0)),
        "type": params.get("type", "expense").lower(),
        "category": params.get("category", "Other"),
        "description": params.get("description", ""),
        "date": datetime.now(timezone.utc)
    }
    result = await db["transactions"].insert_one(tx_dict)
    return {"success": True, "message": f"Added {tx_dict['type']} of ₹{tx_dict['amount']} to {tx_dict['category']}", "id": str(result.inserted_id)}

async def _delete_transaction(db, user_id: str, params: Dict[str, Any]):
    # Try fuzzy match by description or exact amount if provided
    query = {"user_id": user_id}
    if params.get("description"):
        query["description"] = {"$regex": params["description"], "$options": "i"}
    if params.get("amount"):
        query["amount"] = float(params["amount"])
    
    # Sort by recent
    doc = await db["transactions"].find_one(query, sort=[("date", -1)])
    if not doc:
        return {"success": False, "message": "No matching transaction found to delete."}
    
    await db["transactions"].delete_one({"_id": doc["_id"]})
    return {"success": True, "message": f"Deleted transaction: {doc.get('description')} (₹{doc.get('amount')})"}

async def _add_goal(db, user_id: str, params: Dict[str, Any]):
    target = float(params.get("target", 0))
    current = float(params.get("current", 0))
    goal_dict = {
        "user_id": user_id,
        "title": params.get("title", "New Goal"),
        "target": target,
        "current": current,
        "source": "ai_mentor",
        "created_at": datetime.now(timezone.utc)
    }
    # Derived fields
    remaining = max(target - current, 0)
    goal_dict["required_monthly_12m"] = round(remaining / 12, 2)
    goal_dict["percent_complete"] = round((current / target * 100), 1) if target > 0 else 0
    
    result = await db["goals"].insert_one(goal_dict)
    return {"success": True, "message": f"Created new goal: {goal_dict['title']} with target ₹{target}", "id": str(result.inserted_id)}

async def _update_goal(db, user_id: str, params: Dict[str, Any]):
    query = {"user_id": user_id}
    if params.get("title"):
        query["title"] = {"$regex": params["title"], "$options": "i"}
    
    goal = await db["goals"].find_one(query)
    if not goal:
        return {"success": False, "message": "Goal not found."}
    
    update_data = {}
    if params.get("current") is not None:
        update_data["current"] = float(params["current"])
    if params.get("target") is not None:
        update_data["target"] = float(params["target"])
        
    if not update_data:
        return {"success": False, "message": "Nothing to update."}

    # Recalculate derived
    t = update_data.get("target", goal.get("target", 0))
    c = update_data.get("current", goal.get("current", 0))
    rem = max(t - c, 0)
    update_data["required_monthly_12m"] = round(rem / 12, 2)
    update_data["percent_complete"] = round((c / t * 100), 1) if t > 0 else 0

    await db["goals"].update_one({"_id": goal["_id"]}, {"$set": update_data})
    return {"success": True, "message": f"Updated goal {goal['title']}."}
