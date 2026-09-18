# routes.py
# This file defines ALL API endpoints (URL paths) for the expense tracker backend.
# It uses FastAPI's APIRouter — think of it as Flask's Blueprint, but for FastAPI.
#
# AUTHENTICATION:
# Every route is protected with: user_id: str = Depends(get_current_user)
# This means FastAPI automatically:
#   1. Reads the "Authorization: Bearer <token>" header
#   2. Calls auth.py to verify the Clerk JWT
#   3. Extracts the Clerk user ID
#   4. Passes it as the "user_id" parameter to the route function
# If the token is missing or invalid, FastAPI returns 401 BEFORE calling the function.
#
# RESPONSE FORMAT:
# FastAPI returns Python dicts as JSON automatically — no jsonify() needed.
# For errors, we raise HTTPException(status_code=..., detail="message")
#
# API ENDPOINTS SUMMARY:
# GET  /api/health_check          — Health check (public, no auth required)
# GET  /api/me                    — Get current user's Clerk ID
#
# GET  /api/expenses              — Get all expenses for logged-in user
# POST /api/expenses              — Add a new expense
# DELETE /api/expenses/{id}       — Delete an expense by ID
#
# GET  /api/budget?month=YYYY-MM  — Get budget for a specific month
# GET  /api/budgets               — Get all monthly budgets for the user
# POST /api/budget                — Save/update budget for a specific month
#
# GET  /api/notifications         — Get all notifications
# POST /api/notifications         — Create a new notification
# PUT  /api/notifications/{id}/read  — Mark one notification as read
# DELETE /api/notifications       — Clear all notifications

from fastapi import APIRouter, Depends, HTTPException, Query, status
from auth import get_current_user
from schemas import ExpenseCreate, BudgetCreate, NotificationCreate
import models

# Create an APIRouter instance — routes defined here are mounted in app.py
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK (no auth required)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/api/health_check", tags=["Health"])
async def health_check():
    """
    Public health check endpoint.
    Call this to verify the FastAPI server is up and the MongoDB connection is alive.
    Returns: {"status": "ok", "db": "connected"}
    """
    from database import motor_client
    try:
        await motor_client.admin.command("ping")
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"DB not connected: {str(e)}"
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
async def list_expenses(user_id: str = Depends(get_current_user)):
    """
    GET /api/expenses
    Returns all expense records for the logged-in user, sorted newest first.
    Frontend calls this on page load to populate the expense list.
    """
    expenses = await models.get_expenses(user_id)
    return {"expenses": expenses}


@router.post("/api/expenses", status_code=status.HTTP_201_CREATED, tags=["Expenses"])
async def add_expense(
    expense: ExpenseCreate,
    user_id: str = Depends(get_current_user)
):
    """
    POST /api/expenses
    Creates a new expense record.
    Request body (validated by ExpenseCreate schema):
        { "title": "Lunch", "amount": 350, "category": "Food", "date": "2026-09-06" }
    Returns the created expense document with its MongoDB _id.
    """
    new_expense = await models.create_expense(user_id, expense.model_dump())
    return {"expense": new_expense}


@router.delete("/api/expenses/{expense_id}", tags=["Expenses"])
async def remove_expense(
    expense_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    DELETE /api/expenses/{expense_id}
    Deletes the expense with the given ID (only if it belongs to the logged-in user).
    Returns: {"deleted": true} on success, 404 if not found or unauthorized.
    """
    deleted = await models.delete_expense(user_id, expense_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found or you don't have permission to delete it."
        )
    return {"deleted": True}


# ─────────────────────────────────────────────────────────────────────────────
# BUDGET ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/api/budget", tags=["Budget"])
async def get_budget(
    month: str = Query(..., description="Month in YYYY-MM format, e.g. 2026-09"),
    user_id: str = Depends(get_current_user)
):
    """
    GET /api/budget?month=2026-09
    Returns the budget saved for a specific month.
    Returns null (HTTP 200 with null body) if no budget exists for that month yet.
    The frontend uses this to pre-fill the Budget page form.
    """
    budget = await models.get_budget(user_id, month)
    return {"budget": budget}


@router.get("/api/budgets", tags=["Budget"])
async def list_budgets(user_id: str = Depends(get_current_user)):
    """
    GET /api/budgets
    Returns all monthly budget records for the logged-in user.
    The frontend uses this to build the dashboard chart's budget bar for each month.
    """
    budgets = await models.get_all_budgets(user_id)
    return {"budgets": budgets}


@router.post("/api/budget", tags=["Budget"])
async def save_budget(
    budget: BudgetCreate,
    user_id: str = Depends(get_current_user)
):
    """
    POST /api/budget
    Saves (upserts) the budget for a specific month.
    If a budget already exists for that month, it is UPDATED (not duplicated).
    If no budget exists for that month, a NEW document is created.

    This is the key fix for budget isolation:
    "Upsert by (user_id, month)" means September's save NEVER touches August.

    Request body (validated by BudgetCreate schema):
    {
        "month": "2026-09",
        "income": 50000,
        "categories": { "Food": 10000, "Transport": 5000, ... }
    }
    """
    saved = await models.upsert_budget(user_id, budget.model_dump())
    return {"budget": saved}


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATIONS ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/api/notifications", tags=["Notifications"])
async def list_notifications(user_id: str = Depends(get_current_user)):
    """
    GET /api/notifications
    Returns all notifications for the logged-in user, newest first.
    Replaces localStorage "global_notifications".
    """
    notifications = await models.get_notifications(user_id)
    return {"notifications": notifications}


@router.post("/api/notifications", status_code=status.HTTP_201_CREATED, tags=["Notifications"])
async def add_notification(
    notification: NotificationCreate,
    user_id: str = Depends(get_current_user)
):
    """
    POST /api/notifications
    Creates a new notification for the logged-in user.
    Request body: { "text": "Budget exceeded!", "type": "error" }
    """
    new_notification = await models.create_notification(user_id, notification.model_dump())
    return {"notification": new_notification}


@router.put("/api/notifications/{notification_id}/read", tags=["Notifications"])
async def read_notification(
    notification_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    PUT /api/notifications/{notification_id}/read
    Marks a single notification as read (sets read=true in MongoDB).
    Returns: {"updated": true}
    """
    updated = await models.mark_notification_read(user_id, notification_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found."
        )
    return {"updated": True}


@router.delete("/api/notifications", tags=["Notifications"])
async def clear_all_notifications(user_id: str = Depends(get_current_user)):
    """
    DELETE /api/notifications
    Deletes ALL notifications for the logged-in user (clear all button).
    Returns: {"cleared": <number of deleted docs>}
    """
    count = await models.clear_notifications(user_id)
    return {"cleared": count}


# ─────────────────────────────────────────────────────────────────────────────
# AI ENDPOINTS (PLACEHOLDER — not implemented yet)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/api/ai/analyze", tags=["AI"])
async def ai_analyze(user_id: str = Depends(get_current_user)):
    """
    POST /api/ai/analyze
    [PLACEHOLDER] Will analyze spending patterns and return AI-generated insights.
    Implementation pending — Groq API integration to be added later.
    """
    return {"message": "AI analysis coming soon.", "user_id": user_id}


@router.post("/api/ai/chat", tags=["AI"])
async def ai_chat(user_id: str = Depends(get_current_user)):
    """
    POST /api/ai/chat
    [PLACEHOLDER] Will power an AI chatbot for personal finance queries.
    Implementation pending — Groq API integration to be added later.
    """
    return {"message": "AI chat coming soon.", "user_id": user_id}
