# schemas.py
# Pydantic models define the EXACT shape of data coming in (request body)
# and going out (response body) for each API endpoint.
# FastAPI automatically validates all incoming data against these models
# and returns a clear error message if anything is missing or wrong.

from pydantic import BaseModel, Field
from typing import Optional, Dict


# ---------------------------------------------------------------------------
# EXPENSES
# ---------------------------------------------------------------------------

class ExpenseCreate(BaseModel):
    """
    Shape of data the frontend sends when logging a new expense.
    Example request body:
    {
        "title": "Lunch at Dominos",
        "amount": 350.0,
        "category": "Food",
        "date": "2026-09-06",
        "notes": "Team lunch"
    }
    """
    title: str                          # Name of the transaction (required)
    amount: float                       # Amount spent in ₹ (required)
    category: str                       # Category name like "Food", "Transport" (required)
    date: str                           # Date string in "YYYY-MM-DD" format (required)
    notes: Optional[str] = ""           # Optional description or note


# ---------------------------------------------------------------------------
# BUDGETS (Replaces localStorage "monthly_budgets_by_month")
# ---------------------------------------------------------------------------

class CategoryLimits(BaseModel):
    """
    Per-category budget limits (in ₹).
    All categories are optional — defaults to 0 if not set.
    """
    Food: Optional[float] = 0
    Transport: Optional[float] = 0
    Shopping: Optional[float] = 0
    Entertainment: Optional[float] = 0
    Utilities: Optional[float] = 0
    Other: Optional[float] = 0


class BudgetCreate(BaseModel):
    """
    Shape of data the frontend sends when saving a monthly budget.
    Example request body:
    {
        "month": "2026-09",
        "income": 50000.0,
        "categories": {
            "Food": 10000,
            "Transport": 5000,
            "Shopping": 8000,
            "Entertainment": 4000,
            "Utilities": 3000,
            "Other": 2000
        }
    }
    """
    month: str                          # Month key in "YYYY-MM" format (e.g. "2026-09")
    income: float = 0                   # Total monthly income budget (₹)
    categories: Optional[CategoryLimits] = CategoryLimits()  # Per-category limits


# ---------------------------------------------------------------------------
# NOTIFICATIONS (Replaces localStorage "global_notifications")
# ---------------------------------------------------------------------------

class NotificationCreate(BaseModel):
    """
    Shape of data the frontend sends when logging a new system alert.
    Example request body:
    {
        "text": "Warning: Food budget exceeded!",
        "type": "error"
    }
    """
    text: str                           # The notification message text
    type: Optional[str] = "info"        # Severity: "info" | "success" | "warning" | "error"
