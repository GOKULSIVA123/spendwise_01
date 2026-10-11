# routes.py
# This file defines ALL API endpoints (URL paths) for the expense tracker backend.
# Uses FastAPI's APIRouter and injects the async SQLAlchemy session into each route.

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from pydantic import BaseModel
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select

from database import get_db
from auth import get_current_user
from schemas import ExpenseCreate, BudgetCreate, NotificationCreate
from gpay_parser import parse_gpay_document
import models

# Create an APIRouter instance — routes defined here are mounted in app.py
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK (no auth required)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/api/health_check", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Public health check endpoint.
    Verifies that the FastAPI server is running and the database is responsive.
    Returns: {"status": "ok", "db": "connected"}
    """
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"DB not connected: {str(e)}",
        )


# ─────────────────────────────────────────────────────────────────────────────
# AUTH / ME ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/api/me", tags=["Auth"])
async def get_me(user_id: str = Depends(get_current_user)):
    """
    Returns the currently logged-in user's Clerk ID.
    Useful for the frontend to confirm the token is valid and get the user ID.
    Returns: {"user_id": "user_2pX..."}
    """
    return {"user_id": user_id}


# ─────────────────────────────────────────────────────────────────────────────
# EXPENSES ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/api/expenses", tags=["Expenses"])
async def list_expenses(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    GET /api/expenses
    Returns all expense records for the logged-in user, sorted newest first.
    """
    expenses = await models.get_expenses(db, user_id)
    return {"expenses": expenses}


@router.post("/api/expenses", status_code=status.HTTP_201_CREATED, tags=["Expenses"])
async def add_expense(
    expense: ExpenseCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    POST /api/expenses
    Creates a new expense record in the database.
    """
    new_expense = await models.create_expense(db, user_id, expense.model_dump())
    return {"expense": new_expense}


@router.delete("/api/expenses/{expense_id}", tags=["Expenses"])
async def remove_expense(
    expense_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    DELETE /api/expenses/{expense_id}
    Deletes the expense matching ID and owner user_id.
    """
    deleted = await models.delete_expense(db, user_id, expense_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found or you don't have permission to delete it.",
        )
    return {"deleted": True}


# ─────────────────────────────────────────────────────────────────────────────
# BUDGET ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/api/budget", tags=["Budget"])
async def get_budget(
    month: str = Query(..., description="Month in YYYY-MM format, e.g. 2026-09"),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    GET /api/budget?month=YYYY-MM
    Returns the budget saved for a specific month (or null if not created).
    """
    budget = await models.get_budget(db, user_id, month)
    return {"budget": budget}


@router.get("/api/budgets", tags=["Budget"])
async def list_budgets(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    GET /api/budgets
    Returns all monthly budget records for the logged-in user.
    """
    budgets = await models.get_all_budgets(db, user_id)
    return {"budgets": budgets}


@router.post("/api/budget", tags=["Budget"])
async def save_budget(
    budget: BudgetCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    POST /api/budget
    Saves or updates (upserts) the budget for a specific month.
    """
    saved = await models.upsert_budget(db, user_id, budget.model_dump())
    return {"budget": saved}


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATIONS ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/api/notifications", tags=["Notifications"])
async def list_notifications(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    GET /api/notifications
    Returns all notifications for the logged-in user, newest first.
    """
    notifications = await models.get_notifications(db, user_id)
    return {"notifications": notifications}


@router.post("/api/notifications", status_code=status.HTTP_201_CREATED, tags=["Notifications"])
async def add_notification(
    notification: NotificationCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    POST /api/notifications
    Creates a new notification for the logged-in user.
    """
    new_notification = await models.create_notification(
        db, user_id, notification.model_dump()
    )
    return {"notification": new_notification}


@router.put("/api/notifications/{notification_id}/read", tags=["Notifications"])
async def read_notification(
    notification_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    PUT /api/notifications/{notification_id}/read
    Marks a single notification as read.
    """
    updated = await models.mark_notification_read(db, user_id, notification_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )
    return {"updated": True}


@router.delete("/api/notifications", tags=["Notifications"])
async def clear_all_notifications(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    DELETE /api/notifications
    Deletes all notifications for the logged-in user.
    """
    count = await models.clear_notifications(db, user_id)
    return {"cleared": count}


# ─────────────────────────────────────────────────────────────────────────────
# GPAY & UPI STATEMENT DOCUMENT INGESTION
# ─────────────────────────────────────────────────────────────────────────────

class BulkExpenseCreate(BaseModel):
    expenses: List[ExpenseCreate]


@router.post("/api/expenses/parse-gpay", tags=["GPay Import"])
async def parse_gpay(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    POST /api/expenses/parse-gpay
    Parses an uploaded GPay CSV or PDF statement into structured transactions.
    Checks for duplicates against the user's existing records in SQLite.
    Does NOT save to database yet — returns candidate rows for UI modal preview!
    """
    try:
        content = await file.read()
        print(f"📄 Upload received: '{file.filename}' ({len(content)} bytes)")
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is empty (0 bytes).",
            )

        parsed = parse_gpay_document(content, file.filename or "statement.csv")
        print(f"📊 Parsed {len(parsed)} transaction records from '{file.filename}'")
        if not parsed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No debit transactions found in the document. Please verify the file contains UPI or debit expenses, or try exporting as CSV from Google Pay.",
            )

        # Check existing expenses in DB to tag duplicates
        from models import Expense
        existing_stmt = select(Expense.date, Expense.amount, Expense.title).where(
            Expense.user_id == user_id
        )
        existing_res = await db.execute(existing_stmt)
        existing_set = set()
        for r in existing_res.all():
            try:
                d = str(r[0] or "")
                a = round(float(r[1] or 0), 2)
                t = str(r[2] or "").strip().lower()
                existing_set.add((d, a, t))
            except Exception:
                pass

        transactions = []
        for item in parsed:
            amt = round(float(item.get("amount", 0)), 2)
            title = str(item.get("title", "")).strip()
            date_str = str(item.get("date", ""))
            key = (date_str, amt, title.lower())

            item_copy = dict(item)
            item_copy["amount"] = amt
            item_copy["is_duplicate"] = key in existing_set
            transactions.append(item_copy)

        return {
            "success": True,
            "filename": file.filename,
            "total_count": len(transactions),
            "transactions": transactions,
        }
    except ValueError as ve:
        print(f"⚠️ Validation error parsing '{file.filename}': {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in parse_gpay endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse document: {str(e)}",
        )


@router.post("/api/expenses/bulk-add", status_code=status.HTTP_201_CREATED, tags=["GPay Import"])
async def bulk_add_expenses(
    payload: BulkExpenseCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    POST /api/expenses/bulk-add
    Inserts a confirmed list of transactions into SQLite in a single batch.
    Performs deduplication automatically.
    """
    items = [e.model_dump() for e in payload.expenses]
    created, skipped = await models.bulk_create_expenses(db, user_id, items)
    return {
        "success": True,
        "imported_count": len(created),
        "skipped_count": skipped,
        "expenses": created,
    }


@router.post("/api/expenses/upload-gpay", status_code=status.HTTP_201_CREATED, tags=["GPay Import"])
async def upload_gpay_direct(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    POST /api/expenses/upload-gpay
    Direct one-step import: parses document and immediately saves non-duplicates to SQLite.
    """
    content = await file.read()
    parsed = parse_gpay_document(content, file.filename or "statement.csv")
    if not parsed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid transactions could be found in the uploaded file.",
        )

    created, skipped = await models.bulk_create_expenses(db, user_id, parsed)
    return {
        "success": True,
        "imported_count": len(created),
        "skipped_count": skipped,
        "expenses": created,
    }



# ─────────────────────────────────────────────────────────────────────────────
# AI ENDPOINTS (PLACEHOLDER)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/api/ai/analyze", tags=["AI"])
async def ai_analyze(user_id: str = Depends(get_current_user)):
    """
    POST /api/ai/analyze
    [PLACEHOLDER] AI spending analysis.
    """
    return {"message": "AI analysis coming soon.", "user_id": user_id}


@router.post("/api/ai/chat", tags=["AI"])
async def ai_chat(user_id: str = Depends(get_current_user)):
    """
    POST /api/ai/chat
    [PLACEHOLDER] AI finance chatbot.
    """
    return {"message": "AI chat coming soon.", "user_id": user_id}
