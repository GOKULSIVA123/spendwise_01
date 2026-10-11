# models.py
# SQLAlchemy ORM models and async CRUD operations.
#
# COMPATIBILITY GUARANTEE:
# - All queries are fully asynchronous using SQLAlchemy 2.0 select()/delete().
# - Every model includes a .to_dict() helper that returns BOTH "_id" and "id".
#   This guarantees 100% backward compatibility with the React frontend!

import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    Boolean,
    Float,
    String,
    Text,
    JSON,
    UniqueConstraint,
    select,
    delete,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.asyncio import AsyncSession
from database import Base


# ─────────────────────────────────────────────────────────────────────────────
# SQLALCHEMY ORM MODELS
# ─────────────────────────────────────────────────────────────────────────────

class Expense(Base):
    """
    Expenses table:
    Stores every individual transaction logged by a user.
    """
    __tablename__ = "expenses"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    date: Mapped[str] = mapped_column(String(10), index=True, nullable=False)  # "YYYY-MM-DD"
    notes: Mapped[str] = mapped_column(Text, default="", nullable=True)
    created_at: Mapped[str] = mapped_column(
        String(35), default=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict:
        """
        Converts the ORM instance into a JSON-safe dictionary.
        Returns both '_id' (for MongoDB frontend compatibility) and 'id'.
        """
        return {
            "_id": self.id,
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "amount": self.amount,
            "category": self.category,
            "date": self.date,
            "notes": self.notes or "",
            "created_at": self.created_at,
        }


class Budget(Base):
    """
    Budgets table:
    Stores monthly budget limits per user.
    Unique constraint on (user_id, month) prevents duplicate records.
    """
    __tablename__ = "budgets"
    __table_args__ = (
        UniqueConstraint("user_id", "month", name="uq_user_month_budget"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    month: Mapped[str] = mapped_column(String(7), index=True, nullable=False)  # "YYYY-MM"
    income: Mapped[float] = mapped_column(Float, default=0.0)
    categories: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[str] = mapped_column(
        String(35), default=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict:
        return {
            "_id": self.id,
            "id": self.id,
            "user_id": self.user_id,
            "month": self.month,
            "income": self.income,
            "categories": self.categories or {},
            "updated_at": self.updated_at,
        }


class Notification(Base):
    """
    Notifications table:
    Stores user alerts (e.g. budget warnings).
    """
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="info")
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[str] = mapped_column(
        String(35), default=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict:
        return {
            "_id": self.id,
            "id": self.id,
            "user_id": self.user_id,
            "text": self.text,
            "type": self.type,
            "read": self.read,
            "created_at": self.created_at,
        }


# ─────────────────────────────────────────────────────────────────────────────
# CRUD OPERATIONS: EXPENSES
# ─────────────────────────────────────────────────────────────────────────────

async def create_expense(db: AsyncSession, user_id: str, data: dict) -> dict:
    """
    Inserts a new expense row for the user.
    """
    expense = Expense(
        user_id=user_id,
        title=data["title"],
        amount=float(data["amount"]),
        category=data["category"],
        date=data["date"],
        notes=data.get("notes", ""),
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense.to_dict()


async def bulk_create_expenses(db: AsyncSession, user_id: str, expenses_list: list[dict]) -> tuple[list[dict], int]:
    """
    Inserts a batch of expenses for a user with smart deduplication.
    Returns: (list_of_created_expenses, skipped_duplicates_count)
    """
    if not expenses_list:
        return [], 0

    # Fetch existing transactions to detect duplicates
    existing_stmt = select(Expense.date, Expense.amount, Expense.title).where(Expense.user_id == user_id)
    existing_res = await db.execute(existing_stmt)
    existing_set = set(
        (str(row[0]), round(float(row[1]), 2), str(row[2]).strip().lower())
        for row in existing_res.all()
    )

    created_expenses = []
    skipped = 0
    now_iso = datetime.now(timezone.utc).isoformat()

    for item in expenses_list:
        date_str = str(item.get("date", ""))
        amt = round(float(item.get("amount", 0)), 2)
        title = str(item.get("title", "Expense")).strip()

        dedup_key = (date_str, amt, title.lower())
        if dedup_key in existing_set:
            skipped += 1
            continue

        existing_set.add(dedup_key)
        new_exp = Expense(
            user_id=user_id,
            title=title,
            amount=amt,
            category=item.get("category", "Other"),
            date=date_str,
            notes=item.get("notes", "Imported via GPay Statement"),
            created_at=now_iso,
        )
        db.add(new_exp)
        created_expenses.append(new_exp)

    if created_expenses:
        await db.commit()
        for exp in created_expenses:
            await db.refresh(exp)

    return [e.to_dict() for e in created_expenses], skipped


async def get_expenses(db: AsyncSession, user_id: str) -> list[dict]:
    """
    Fetches all expenses for the user, sorted newest first (by date descending).
    """
    stmt = (
        select(Expense)
        .where(Expense.user_id == user_id)
        .order_by(Expense.date.desc(), Expense.created_at.desc())
    )
    result = await db.execute(stmt)
    records = result.scalars().all()
    return [rec.to_dict() for rec in records]


async def delete_expense(db: AsyncSession, user_id: str, expense_id: str) -> bool:
    """
    Deletes an expense matching user_id and expense_id.
    Ensures ownership verification for security.
    """
    stmt = select(Expense).where(Expense.id == expense_id, Expense.user_id == user_id)
    result = await db.execute(stmt)
    expense = result.scalar_one_or_none()
    if not expense:
        return False
    await db.delete(expense)
    await db.commit()
    return True


async def get_expenses_for_month(db: AsyncSession, user_id: str, month: str) -> list[dict]:
    """
    Fetches expenses for a specific month (e.g. "2026-09").
    Matches date starting with "YYYY-MM" (e.g. "2026-09%").
    """
    stmt = (
        select(Expense)
        .where(Expense.user_id == user_id, Expense.date.like(f"{month}%"))
        .order_by(Expense.date.desc())
    )
    result = await db.execute(stmt)
    records = result.scalars().all()
    return [rec.to_dict() for rec in records]


# ─────────────────────────────────────────────────────────────────────────────
# CRUD OPERATIONS: BUDGETS
# ─────────────────────────────────────────────────────────────────────────────

async def upsert_budget(db: AsyncSession, user_id: str, data: dict) -> dict:
    """
    Creates or updates the budget for a specific month.
    Maintains month isolation: (user_id, month) is unique.
    """
    month = data["month"]
    income = float(data.get("income", 0))
    raw_cats = data.get("categories", {})
    categories = raw_cats.model_dump() if hasattr(raw_cats, "model_dump") else raw_cats

    stmt = select(Budget).where(Budget.user_id == user_id, Budget.month == month)
    result = await db.execute(stmt)
    budget = result.scalar_one_or_none()

    now_iso = datetime.now(timezone.utc).isoformat()
    if budget:
        budget.income = income
        budget.categories = categories
        budget.updated_at = now_iso
    else:
        budget = Budget(
            user_id=user_id,
            month=month,
            income=income,
            categories=categories,
            updated_at=now_iso,
        )
        db.add(budget)

    await db.commit()
    await db.refresh(budget)
    return budget.to_dict()


async def get_budget(db: AsyncSession, user_id: str, month: str) -> Optional[dict]:
    """
    Fetches budget for a user and month, or None if not configured.
    """
    stmt = select(Budget).where(Budget.user_id == user_id, Budget.month == month)
    result = await db.execute(stmt)
    budget = result.scalar_one_or_none()
    return budget.to_dict() if budget else None


async def get_all_budgets(db: AsyncSession, user_id: str) -> list[dict]:
    """
    Fetches all monthly budget records for the user, newest month first.
    """
    stmt = (
        select(Budget)
        .where(Budget.user_id == user_id)
        .order_by(Budget.month.desc())
    )
    result = await db.execute(stmt)
    records = result.scalars().all()
    return [rec.to_dict() for rec in records]


# ─────────────────────────────────────────────────────────────────────────────
# CRUD OPERATIONS: NOTIFICATIONS
# ─────────────────────────────────────────────────────────────────────────────

async def create_notification(db: AsyncSession, user_id: str, data: dict) -> dict:
    """
    Inserts a new system notification for a user.
    """
    notification = Notification(
        user_id=user_id,
        text=data["text"],
        type=data.get("type", "info"),
        read=False,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification.to_dict()


async def get_notifications(db: AsyncSession, user_id: str) -> list[dict]:
    """
    Fetches all notifications for a user, sorted newest first.
    """
    stmt = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
    )
    result = await db.execute(stmt)
    records = result.scalars().all()
    return [rec.to_dict() for rec in records]


async def mark_notification_read(db: AsyncSession, user_id: str, notification_id: str) -> bool:
    """
    Marks a single notification as read.
    """
    stmt = select(Notification).where(
        Notification.id == notification_id, Notification.user_id == user_id
    )
    result = await db.execute(stmt)
    notif = result.scalar_one_or_none()
    if not notif:
        return False
    notif.read = True
    await db.commit()
    return True


async def clear_notifications(db: AsyncSession, user_id: str) -> int:
    """
    Deletes all notifications for the given user.
    """
    stmt = delete(Notification).where(Notification.user_id == user_id)
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount
