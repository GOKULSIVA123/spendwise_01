# models.py
# This file contains all database CRUD (Create, Read, Update, Delete) functions.
# They talk directly to MongoDB collections using Motor's async API.
#
# DIFFERENCE FROM OLD CODE:
# Old (PyMongo, synchronous):   db.expenses.find({"user_id": uid})
# New (Motor, asynchronous):    await db.expenses.find({"user_id": uid}).to_list(None)
#
# The key rules:
# - Every function that touches the database MUST be "async def"
# - Every MongoDB operation MUST use "await" in front of it
# - .find() returns a cursor — you must call .to_list(None) to get all results as a list
# - .find_one() still returns a single dict (or None), no .to_list() needed
#
# MongoDB ObjectId:
# MongoDB stores each document with "_id" as a BSON ObjectId (not a plain string).
# We convert it to a string using str(doc["_id"]) before sending it to the frontend.
# The helper function _serialize() handles this conversion for all documents.

from bson import ObjectId
from datetime import datetime, timezone
from database import get_db


# ─────────────────────────────────────────────────────────────────────────────
# UTILITY HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _serialize(doc: dict) -> dict:
    """
    Converts a MongoDB document into a JSON-safe dictionary.
    Problem: MongoDB's ObjectId type cannot be serialized to JSON directly.
    Solution: We convert _id to a plain string.
    Example: {"_id": ObjectId("64b...")} → {"_id": "64b..."}
    """
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ─────────────────────────────────────────────────────────────────────────────
# EXPENSES COLLECTION
# Collection name: "expenses"
# Documents look like:
#   {
#     "_id": ObjectId(...),
#     "user_id": "user_2pX...",          ← Clerk user ID
#     "title": "Lunch",
#     "amount": 350.0,
#     "category": "Food",
#     "date": "2026-09-06",
#     "notes": "",
#     "created_at": "2026-09-06T12:00:00Z"
#   }
# ─────────────────────────────────────────────────────────────────────────────

async def create_expense(user_id: str, data: dict) -> dict:
    """
    Inserts a new expense document for the given user.
    Returns the newly created document (with the MongoDB-generated _id as a string).
    """
    db = get_db()
    doc = {
        "user_id": user_id,
        "title": data["title"],
        "amount": data["amount"],
        "category": data["category"],
        "date": data["date"],
        "notes": data.get("notes", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.expenses.insert_one(doc)   # Inserts and returns an InsertOneResult
    doc["_id"] = str(result.inserted_id)         # Attach the generated ID back
    return doc


async def get_expenses(user_id: str) -> list[dict]:
    """
    Fetches all expense documents for the given user, sorted by date (newest first).
    .to_list(None) converts the Motor async cursor into a plain Python list.
    """
    db = get_db()
    cursor = db.expenses.find({"user_id": user_id}).sort("date", -1)
    docs = await cursor.to_list(None)             # None = no limit — fetch all
    return [_serialize(doc) for doc in docs]


async def delete_expense(user_id: str, expense_id: str) -> bool:
    """
    Deletes the expense document matching both user_id and expense_id.
    The user_id check prevents users from deleting other users' data.
    Returns True if a document was deleted, False if not found.
    """
    db = get_db()
    result = await db.expenses.delete_one({
        "_id": ObjectId(expense_id),
        "user_id": user_id,    # Security: ensures ownership
    })
    return result.deleted_count == 1


async def get_expenses_for_month(user_id: str, month: str) -> list[dict]:
    """
    Fetches all expenses for a specific month.
    month: "YYYY-MM" format (e.g. "2026-09")
    Uses a regex match on the "date" field since dates are stored as "YYYY-MM-DD".
    """
    db = get_db()
    cursor = db.expenses.find({
        "user_id": user_id,
        "date": {"$regex": f"^{month}"}    # Matches all dates starting with "2026-09"
    }).sort("date", -1)
    docs = await cursor.to_list(None)
    return [_serialize(doc) for doc in docs]


# ─────────────────────────────────────────────────────────────────────────────
# BUDGETS COLLECTION
# Collection name: "budgets"
# Documents look like (one per user per month):
#   {
#     "_id": ObjectId(...),
#     "user_id": "user_2pX...",
#     "month": "2026-09",               ← Month key in YYYY-MM format
#     "income": 50000.0,
#     "categories": {
#       "Food": 10000.0,
#       "Transport": 5000.0,
#       "Shopping": 8000.0,
#       "Entertainment": 4000.0,
#       "Utilities": 3000.0,
#       "Other": 2000.0
#     }
#   }
# ─────────────────────────────────────────────────────────────────────────────

async def upsert_budget(user_id: str, data: dict) -> dict:
    """
    Creates or updates the budget for a specific month.
    "Upsert" = Insert if not exists, Update if exists.
    This is the MongoDB $set + upsert=True pattern — it prevents duplicates.

    Uniqueness is guaranteed by the (user_id, month) combination,
    so changing September's budget NEVER touches August's document.
    """
    db = get_db()
    filter_doc = {
        "user_id": user_id,
        "month": data["month"],    # e.g. "2026-09"
    }
    update_doc = {
        "$set": {
            "income": data.get("income", 0),
            "categories": data.get("categories", {}),
        }
    }
    # upsert=True: creates a new document if no match found
    # return_document=True: returns the document AFTER the update
    result = await db.budgets.find_one_and_update(
        filter_doc,
        update_doc,
        upsert=True,
        return_document=True,
    )
    return _serialize(result)


async def get_budget(user_id: str, month: str) -> dict | None:
    """
    Fetches the budget document for a specific user and month.
    Returns None if no budget has been saved for that month yet.
    month: "YYYY-MM" format (e.g. "2026-09")
    """
    db = get_db()
    doc = await db.budgets.find_one({
        "user_id": user_id,
        "month": month,
    })
    return _serialize(doc) if doc else None


async def get_all_budgets(user_id: str) -> list[dict]:
    """
    Fetches all monthly budget documents for a user (for budget history view).
    Sorted by month descending (newest first).
    """
    db = get_db()
    cursor = db.budgets.find({"user_id": user_id}).sort("month", -1)
    docs = await cursor.to_list(None)
    return [_serialize(doc) for doc in docs]


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATIONS COLLECTION
# Collection name: "notifications"
# Documents look like:
#   {
#     "_id": ObjectId(...),
#     "user_id": "user_2pX...",
#     "text": "Warning: Food budget exceeded!",
#     "type": "error",
#     "created_at": "2026-09-06T12:00:00Z",
#     "read": false
#   }
# ─────────────────────────────────────────────────────────────────────────────

async def create_notification(user_id: str, data: dict) -> dict:
    """
    Inserts a new notification document for the given user.
    """
    db = get_db()
    doc = {
        "user_id": user_id,
        "text": data["text"],
        "type": data.get("type", "info"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read": False,
    }
    result = await db.notifications.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


async def get_notifications(user_id: str) -> list[dict]:
    """
    Fetches all notifications for the user, sorted by creation time (newest first).
    """
    db = get_db()
    cursor = db.notifications.find({"user_id": user_id}).sort("created_at", -1)
    docs = await cursor.to_list(None)
    return [_serialize(doc) for doc in docs]


async def mark_notification_read(user_id: str, notification_id: str) -> bool:
    """
    Marks a single notification as read (sets read=True).
    Returns True if updated, False if not found.
    """
    db = get_db()
    result = await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": user_id},
        {"$set": {"read": True}},
    )
    return result.modified_count == 1


async def clear_notifications(user_id: str) -> int:
    """
    Deletes ALL notification documents for the given user.
    Returns the count of deleted documents.
    """
    db = get_db()
    result = await db.notifications.delete_many({"user_id": user_id})
    return result.deleted_count
