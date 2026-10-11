# test_sqlite.py
# Standalone test script to verify that SQLAlchemy 2.0 + SQLite async works properly.
# Run with: python test_sqlite.py

import asyncio
import os
from database import connect_db, disconnect_db, AsyncSessionLocal
import models


async def run_tests():
    print("🔄 Initializing database tables...")
    await connect_db()

    test_user_id = "test_user_sample_123"

    async with AsyncSessionLocal() as session:
        print("\n🧪 1. Testing Create Expense...")
        expense_data = {
            "title": "Grocery Shopping",
            "amount": 1250.50,
            "category": "Food",
            "date": "2026-10-11",
            "notes": "Weekly fruits & vegetables",
        }
        created_expense = await models.create_expense(session, test_user_id, expense_data)
        print(f"   Created Expense: ID={created_expense['id']}, _id={created_expense['_id']}")
        assert created_expense["_id"] == created_expense["id"], "ID and _id mismatch!"
        assert created_expense["amount"] == 1250.50

        print("\n🧪 2. Testing Get Expenses...")
        expenses = await models.get_expenses(session, test_user_id)
        print(f"   Found {len(expenses)} expense(s) for user.")
        assert len(expenses) >= 1

        print("\n🧪 3. Testing Get Expenses for Month...")
        month_expenses = await models.get_expenses_for_month(session, test_user_id, "2026-10")
        print(f"   Found {len(month_expenses)} expense(s) for month 2026-10.")
        assert len(month_expenses) >= 1

        print("\n🧪 4. Testing Upsert Budget...")
        budget_data = {
            "month": "2026-10",
            "income": 75000.0,
            "categories": {
                "Food": 15000,
                "Transport": 5000,
                "Shopping": 10000,
            },
        }
        saved_budget = await models.upsert_budget(session, test_user_id, budget_data)
        print(f"   Saved Budget: month={saved_budget['month']}, income={saved_budget['income']}")
        assert saved_budget["income"] == 75000.0
        assert saved_budget["categories"]["Food"] == 15000

        print("\n🧪 5. Testing Update Budget (Upsert on existing month)...")
        budget_data["income"] = 80000.0
        updated_budget = await models.upsert_budget(session, test_user_id, budget_data)
        print(f"   Updated Budget: income={updated_budget['income']}")
        assert updated_budget["income"] == 80000.0
        assert updated_budget["id"] == saved_budget["id"], "Upsert should update existing row, not duplicate!"

        print("\n🧪 6. Testing Notifications...")
        notif_data = {
            "text": "Your Food budget is at 80%!",
            "type": "warning",
        }
        created_notif = await models.create_notification(session, test_user_id, notif_data)
        print(f"   Created Notification: ID={created_notif['id']}")

        notifs = await models.get_notifications(session, test_user_id)
        assert len(notifs) >= 1

        read_success = await models.mark_notification_read(session, test_user_id, created_notif["id"])
        print(f"   Marked as Read: {read_success}")
        assert read_success is True

        print("\n🧪 7. Testing Cleanup / Delete Expense...")
        del_success = await models.delete_expense(session, test_user_id, created_expense["id"])
        print(f"   Deleted Expense: {del_success}")
        assert del_success is True

        cleared_count = await models.clear_notifications(session, test_user_id)
        print(f"   Cleared Notifications: {cleared_count}")

    await disconnect_db()
    print("\n✅ All SQLAlchemy & SQLite CRUD tests passed successfully!")


if __name__ == "__main__":
    asyncio.run(run_tests())
