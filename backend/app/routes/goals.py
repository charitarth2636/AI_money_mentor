from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.models.goal import GoalCreate
from app.core.security import get_current_user_id
from app.core.database import get_database

router = APIRouter()


# ── POST /goals/ ──────────────────────────────────────────────────
@router.post("/")
async def create_goal(goal: GoalCreate, user_id: str = Depends(get_current_user_id)):
    db = get_database()
    goal_dict = goal.model_dump()
    goal_dict["user_id"] = user_id

    # Backend calculation: required monthly saving to reach in 12 / 24 months
    target  = goal_dict.get("target", 0)
    current = goal_dict.get("current", 0)
    remaining = max(target - current, 0)
    goal_dict["required_monthly_12m"] = round(remaining / 12, 2)  if remaining > 0 else 0
    goal_dict["required_monthly_24m"] = round(remaining / 24, 2)  if remaining > 0 else 0
    goal_dict["percent_complete"]     = round((current / target * 100), 1) if target > 0 else 0

    result = await db["goals"].insert_one(goal_dict)
    goal_dict["id"] = str(result.inserted_id)
    goal_dict.pop("_id", None)
    return {"status": "success", "data": goal_dict}


# ── GET /goals/ ───────────────────────────────────────────────────
@router.get("/")
async def get_goals(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    cursor = db["goals"].find({"user_id": user_id})
    goals = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        # Recalculate progress in case target or current changed
        target  = doc.get("target", 0)
        current = doc.get("current", 0)
        doc["percent_complete"] = round((current / target * 100), 1) if target > 0 else 0
        goals.append(doc)
    return {"status": "success", "data": goals}


# ── PATCH /goals/{goal_id} — update current savings ──────────────
@router.patch("/{goal_id}")
async def update_goal(
    goal_id: str,
    body: dict,
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()
    allowed_fields = {"current", "title", "target"}
    update_data = {k: v for k, v in body.items() if k in allowed_fields}

    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    # Recalculate derived fields
    doc = await db["goals"].find_one({"_id": ObjectId(goal_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Goal not found")

    merged_target  = update_data.get("target",  doc.get("target",  0))
    merged_current = update_data.get("current", doc.get("current", 0))
    remaining = max(merged_target - merged_current, 0)
    update_data["required_monthly_12m"] = round(remaining / 12, 2)
    update_data["required_monthly_24m"] = round(remaining / 24, 2)
    update_data["percent_complete"]     = round((merged_current / merged_target * 100), 1) if merged_target > 0 else 0

    await db["goals"].update_one(
        {"_id": ObjectId(goal_id), "user_id": user_id},
        {"$set": update_data}
    )
    return {"status": "success", "message": "Goal updated"}


# ── DELETE /goals/{goal_id} ───────────────────────────────────────
@router.delete("/{goal_id}")
async def delete_goal(goal_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_database()
    result = await db["goals"].delete_one({
        "_id": ObjectId(goal_id),
        "user_id": user_id
    })
    if result.deleted_count == 0:
        return {"status": "error", "message": "Goal not found"}
    return {"status": "success", "message": "Goal deleted"}
