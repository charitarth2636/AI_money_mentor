from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from typing import Optional
from app.models.transaction import TransactionCreate
from app.core.security import get_current_user_id
from app.core.database import get_database
from bson import ObjectId
from pydantic import BaseModel

router = APIRouter()


# ── Edit model ─────────────────────────────────────────────────────
class TransactionUpdate(BaseModel):
    amount:      Optional[float]  = None
    category:    Optional[str]    = None
    description: Optional[str]    = None
    date:        Optional[str]    = None   # ISO string
    type:        Optional[str]    = None   # "income" | "expense"


# ── Helper: aggregate all transactions for a user ──────────────────
async def get_transaction_summary(db, user_id: str) -> dict:
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$type", "total": {"$sum": "$amount"}}}
    ]
    results = await db["transactions"].aggregate(pipeline).to_list(None)
    totals = {r["_id"]: r["total"] for r in results}

    cat_pipeline = [
        {"$match": {"user_id": user_id, "type": "expense"}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
        {"$sort": {"total": -1}}
    ]
    cat_results = await db["transactions"].aggregate(cat_pipeline).to_list(None)
    categories = {r["_id"]: r["total"] for r in cat_results}

    total_income  = totals.get("income",  0)
    total_expense = totals.get("expense", 0)
    net           = total_income - total_expense

    return {
        "total_income":    round(total_income, 2),
        "total_expense":   round(total_expense, 2),
        "net_balance":     round(net, 2),
        "category_totals": categories,
    }


def _serialize_tx(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id", doc.get("id", "")))
    if isinstance(doc.get("date"), datetime):
        doc["date"] = doc["date"].replace(tzinfo=timezone.utc).isoformat()
    return doc


# ── POST /transactions/ ────────────────────────────────────────────
@router.post("/")
async def create_transaction(
    tx: TransactionCreate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()
    tx_dict = tx.model_dump()
    tx_dict["user_id"] = user_id
    tx_dict["type"] = tx_dict.get("type", "expense").lower().strip()

    result = await db["transactions"].insert_one(tx_dict)
    tx_dict["id"] = str(result.inserted_id)
    tx_dict.pop("_id", None)
    if isinstance(tx_dict.get("date"), datetime):
        tx_dict["date"] = tx_dict["date"].replace(tzinfo=timezone.utc).isoformat()

    return {"status": "success", "data": tx_dict}


# ── GET /transactions/ ─────────────────────────────────────────────
@router.get("/")
async def get_transactions(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    cursor = db["transactions"].find({"user_id": user_id}).sort("date", -1)
    txs = []
    async for doc in cursor:
        txs.append(_serialize_tx(doc))
    return {"status": "success", "data": txs}


# ── GET /transactions/aggregate ────────────────────────────────────
@router.get("/aggregate")
async def get_aggregate(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    summary = await get_transaction_summary(db, user_id)
    return {"status": "success", "data": summary}


# ── PUT /transactions/{tx_id} — Edit transaction ───────────────────
@router.put("/{tx_id}")
async def update_transaction(
    tx_id: str,
    body: TransactionUpdate,
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}

    if not update_data:
        return {"status": "error", "message": "No fields to update"}

    # Normalize type if provided
    if "type" in update_data:
        update_data["type"] = update_data["type"].lower().strip()

    result = await db["transactions"].update_one(
        {"_id": ObjectId(tx_id), "user_id": user_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        return {"status": "error", "message": "Transaction not found"}
    return {"status": "success", "message": "Transaction updated"}


# ── GET /transactions/categories ──────────────────────────────────
@router.get("/categories")
async def get_categories():
    """Returns the list of available categories for income and expense."""
    return {
        "status": "success",
        "data": {
            "income": ["Salary", "Freelance", "Business", "Rental", "Investment Returns", "Other Income"],
            "expense": ["Food & Dining", "Rent/EMI", "Transport", "Shopping", "Utilities", "Healthcare", "Entertainment", "Education", "Insurance", "Other"]
        }
    }


# ── DELETE /transactions/{tx_id} ───────────────────────────────────
@router.delete("/{tx_id}")
async def delete_transaction(
    tx_id: str,
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()
    result = await db["transactions"].delete_one({
        "_id": ObjectId(tx_id),
        "user_id": user_id
    })
    if result.deleted_count == 0:
        return {"status": "error", "message": "Transaction not found"}
    return {"status": "success", "message": "Transaction deleted"}
