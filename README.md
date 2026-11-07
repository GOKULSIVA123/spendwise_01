# 💸 SpendWise

> **AI-Powered Financial Habit Optimizer & Smart Expense Tracker**
> *Effortlessly import GPay & UPI statements to fuel real-time analytics and personalized AI financial coaching.*

<p align="left">
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/SQLAlchemy_2.0-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy 2.0" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Clerk_Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk Auth" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini AI" />
</p>

---

**The Concept:**
Traditional expense trackers only show backward-looking data after money is already gone. SpendWise bridges the gap between raw transaction logging and behavioral finance by pairing instant statement ingestion with AI-driven habit coaching.

Key Problems Solved (Recruiter-Facing Summary):

The Habit Guidance Gap: Moves beyond basic transaction logs by using Google Gemini AI to analyze category-wise spending leaks and deliver personalized financial habit coaching.

Eliminating Manual Tracking Friction: Features a 1-click GPay and UPI statement parser (CSV/PDF) to automate data ingestion and bypass manual entry drop-off.

Historical Data Integrity: Solves retroactive budget overwriting using isolated relational month-scoping to preserve long-term financial trends.

Actionable Financial Visibility: Replaces static numbers with multi-timeframe analytics (Daily to Yearly) and proactive threshold alerts.

Secure Multi-User Isolation: Enforces strict row-level security and session management to prevent cross-account data leaks on shared devices.


---

## 🚀 Quick Start (Local Setup)

### 1. Backend (FastAPI + Python 3.11+)
```bash
cd backend
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # macOS/Linux

pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```
*API running at: `http://127.0.0.1:8000` (Swagger docs at `/docs`)*

### 2. Frontend (React 19 + Vite)
```bash
cd frontend/my-project
npm install
npm run dev
```
*App running at: `http://localhost:5173`*

---

## 🛠️ Tech Stack at a Glance

* **Frontend**: React 19, Tailwind CSS v4, Recharts, Framer Motion, Lucide Icons
* **Backend**: FastAPI (Python), SQLAlchemy 2.0 (Async), Uvicorn
* **Database**: SQLite (`aiosqlite`) for local dev, ready for PostgreSQL (`asyncpg`) in cloud
* **Authentication**: Clerk RS256 Asymmetric JWT
* **Statement Processing**: `pypdf`, `python-dateutil`
* **AI Intelligence**: Google Gemini AI (Habit Coaching & Category Insights)

