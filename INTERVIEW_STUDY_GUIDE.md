# 💼 SpendWise: Full-Stack Architecture & Interview Master Guide

This guide is designed for **software engineering and full-stack interviews**. It documents the architecture of **SpendWise**, the engineering decisions behind the **MongoDB to SQLite/PostgreSQL migration**, the **GPay/UPI document intelligence engine**, and the **real-world production bugs diagnosed and resolved**.

---

## 1. Project Elevator Pitch (How to Introduce SpendWise)

> *"SpendWise is a full-stack personal finance and expense analytics web application. The frontend is built with React 19, Tailwind CSS v4, Recharts, and Clerk Authentication. The backend is an asynchronous REST API built with FastAPI and SQLAlchemy 2.0. The app allows users to log expenses, set strictly isolated monthly category budgets, receive proactive overspending threshold alerts, and visualize financial habits across 4 distinct timeframes. Recently, I led two major engineering milestones: first, an architectural refactor migrating the database layer from MongoDB to an asynchronous relational model using SQLite and SQLAlchemy, preparing the system for cloud deployment on PostgreSQL; second, an automated Google Pay & UPI statement extraction engine that parses raw PDF/CSV transaction statements, cleans merchant titles, auto-categorizes expenses via intelligent heuristics, and synchronizes real-time visual charts with built-in deduplication."*

---

## 2. System Architecture Overview

```mermaid
graph TD
    Client[React 19 + Vite Frontend] <-->|Clerk JWT Bearer Token| Gateway[FastAPI ASGI Server]
    Gateway <--> Auth[auth.py: Clerk JWKS Public Key Verification]
    Gateway <--> Router[routes.py: APIRouter + Dependency Injection]
    Gateway <--> Parser[gpay_parser.py: PDF & CSV Document Engine]
    Router <--> Session[database.py: AsyncSessionLocal / get_db]
    Session <--> ORM[models.py: SQLAlchemy 2.0 ORM]
    ORM <--> DB[(SQLite: spendwise.db / Cloud PostgreSQL)]
```

### Core Technologies
- **Frontend**: React 19, Vite, Context API (`ExpenseContext`, `NavContext`), Tailwind CSS v4, Recharts, Lucide Icons, Sonner Toasts.
- **Backend**: Python 3.11+, FastAPI (ASGI), Uvicorn.
- **Database Layer**: SQLAlchemy 2.0 (Async), `aiosqlite` (local SQLite driver), `asyncpg` ready (PostgreSQL driver).
- **Document Processing**: `pypdf`, `python-dateutil`, `python-multipart`.
- **Authentication & Security**: Clerk Auth, Asymmetric RS256 JWT verification via Clerk JWKS.
- **AI Integration**: Groq Cloud SDK (`llama-3.1-8b-instant`).

---

## 3. Why Migrate from MongoDB to Relational SQL? (Key Interview Question)

### Interview Question: *"Why did you switch from a NoSQL document database (MongoDB) to a relational database (SQL) for a personal finance app?"*

#### The Senior Engineer Answer:
1. **ACID Guarantees & Transactional Integrity:**
   - Financial applications cannot tolerate partial writes or data inconsistencies. Relational databases are built fundamentally around ACID (Atomicity, Consistency, Isolation, Durability).
2. **Schema Enforcement & Data Typing:**
   - In MongoDB, documents are schemaless. An expense could accidentally store `amount` as a string (`"150"`) or omit required fields without DB-level validation.
   - In SQL, column types (`Float`, `String(255)`, `Boolean`) and non-nullable constraints are strictly enforced at the database engine level.
3. **Relational Constraints & Multi-Month Budget Isolation:**
   - In SpendWise, each user can only have **one** budget configuration per month. 
   - We enforce this at the database engine level using a compound unique constraint:
     ```python
     UniqueConstraint("user_id", "month", name="uq_user_month_budget")
     ```
   - This makes duplicate budget entries mathematically impossible, ensuring September's budget changes never contaminate August or October.
4. **Native Aggregation Performance:**
   - Calculating category totals, monthly sums, and timeframe rollups is handled in sub-millisecond SQL queries (`SELECT category, SUM(amount) FROM expenses WHERE user_id = :uid GROUP BY category`) rather than pulling raw documents into application memory.
5. **Deployment Flexibility via SQLAlchemy ORM:**
   - By using SQLAlchemy 2.0, the backend is decoupled from any single vendor. Local development runs on zero-configuration SQLite (`sqlite+aiosqlite:///./spendwise.db`), while production on cloud providers (e.g. Vercel + Neon.tech or Render) switches to PostgreSQL simply by updating `DATABASE_URL`.

---

## 4. Database Schema Design (SQLAlchemy 2.0)

### 1. `Expense` Table
```python
class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    date: Mapped[str] = mapped_column(String(10), index=True, nullable=False)  # "YYYY-MM-DD"
    notes: Mapped[str] = mapped_default="", nullable=True)
    created_at: Mapped[str] = mapped_column(String(35), default=lambda: datetime.now(timezone.utc).isoformat())
```
* **UUID as Primary Key**: Using UUID strings (`3b535e74-...`) prevents ID enumeration attacks and ensures seamless distributed scaling without database sequence bottlenecks.
* **Indexed `user_id` and `date`**: Ensures $O(\log N)$ query speed when filtering a user's transactions by date or month.

### 2. `Budget` Table
```python
class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (UniqueConstraint("user_id", "month", name="uq_user_month_budget"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    month: Mapped[str] = mapped_column(String(7), index=True, nullable=False)  # "YYYY-MM"
    income: Mapped[float] = mapped_column(Float, default=0.0)
    categories: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[str] = mapped_column(String(35), default=lambda: datetime.now(timezone.utc).isoformat())
```
* **Native JSON Column**: Category allocations (`{"Food": 15000, "Transport": 5000}`) are stored in a native JSON column, avoiding unnecessary join tables for simple key-value budget configurations.

---

## 5. Real-World Bugs Diagnosed & Fixed (Interview Gold)

Interviewers love asking: *"Tell me about a challenging bug you encountered and how you diagnosed and resolved it."* Here are three major real-world scenarios from this project:

### Bug Case Study 1: The Production Null Crash (`o.filter is not a function`)
* **Symptom**: The deployed frontend crashed on production with an unhandled TypeError, but worked fine on `localhost:8000`.
* **Root Cause**: On local dev, the backend responds in <5ms. In production, cold starts and network latency caused the API call to fail or return before auth token initialization. If the response was null, global state stored `null`. Downstream components calling `.filter()` on `expenses` crashed the entire React component tree.
* **Resolution**:
  1. Defaulted state initialization to defensive guards:
     ```javascript
     const { expenses: rawExpenses } = useContext(Expensecontent);
     const expenses = Array.isArray(rawExpenses) ? rawExpenses : [];
     ```
  2. Guarded the Axios parser to enforce array fallback:
     ```javascript
     setExpenses(Array.isArray(data) ? data : (data?.expenses || []));
     ```

---

### Bug Case Study 2: The In-Memory Amnesia Bug (Data Resetting to 0 on Refresh)
* **Symptom**: When a user added an expense, it appeared in the UI. But as soon as they refreshed the page, the balance reset to 0.
* **Root Cause**: Two coupled issues:
  1. `addExpense` only executed an optimistic React state update (`setExpenses(prev => [...])`) but lacked the network call (`axios.post('/api/expenses')`).
  2. `fetchExpenses` received an envelope object `{"expenses": [...]}` from FastAPI, but checked `Array.isArray(response.data)`. Because the envelope was an object, the check evaluated to `false` and wiped the state to `[]`.
* **Resolution**:
  - Implemented authenticated `axios.post()` with Clerk bearer token in `addExpense`.
  - Upgraded `fetchExpenses` parser to handle both raw lists and nested envelopes:
    ```javascript
    const expenseList = Array.isArray(data) ? data : (Array.isArray(data?.expenses) ? data.expenses : []);
    ```

---

### Bug Case Study 3: The Cross-Tenant Cache Leak (Data Leaking Between Google Accounts)
* **Symptom**: Adding an expense in User A's Google account caused notifications to appear when logging into User B's Google account on the same browser.
* **Root Cause**:
  1. **Unscoped `localStorage`**: Notifications were stored under a shared key `"global_notifications"` across the browser origin.
  2. **`useEffect` dependency flaw**: The sync hook listened to `[isSignedIn]`. When switching between two signed-in accounts, `isSignedIn` remained `true`, so the sync never re-ran.
  3. **Empty Data Guard Bug**: `if (Array.isArray(notifList) && notifList.length > 0)`: If User B had 0 notifications in the database, `setNotifications` was never called, leaving User A's notifications rendered.
* **Resolution**:
  - Scoped storage keys strictly to Clerk's `userId`:
    ```javascript
    localStorage.setItem(`spendwise_notifications_${userId}`, JSON.stringify(notifications));
    ```
  - Subscribed hooks to `[userId]`, clearing state immediately on account switch.
  - Handled empty database records by resetting to fresh default welcome state rather than ignoring empty lists.

---

## 6. Document Extraction & GPay/UPI Statement Intelligence

### Interview Question: *"How did you build the document ingestion engine for Google Pay and bank statements?"*

#### The Architectural Breakdown:
1. **Multi-Format Extraction Pipeline (`backend/gpay_parser.py`)**:
   - **CSV Ingestion**: Handles multiple encodings (`utf-8`, `utf-8-sig`, `latin-1`). Tokenizes flexible header variants (`Description`, `Narration`, `Remarks`, `Paid To`, `Amount`, `Debit`, `Date`).
   - **PDF Ingestion**: Uses `pypdf` to extract in-memory byte streams page by page. Uses regex pattern matchers to isolate UPI debit transaction lines:
     ```python
     # Matches common UPI lines: Date | Paid to / VPA | Amount | Debit/CR
     re.compile(r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+([₹Rs\.]?\s*[\d,]+\.\d{2})")
     ```
2. **Text Cleaning & Merchant Sanitization**:
   - Raw statements contain messy tokens like `UPI-SWIGGY-129482019@okhdfcbank-REF12345`.
   - The cleaning pipeline removes UPI handles (`@okaxis`, `@paytm`), transaction IDs (`UPI/`, `REF/`), and trailing reference codes, isolating the clean merchant name: `Swiggy`.
3. **Smart Categorization Heuristics**:
   - Rather than sending every line to an expensive LLM, we implemented a high-throughput deterministic keyword dictionary:
     - **Food**: `["swiggy", "zomato", "mcdonald", "starbucks", "blinkit", "zepto", "restaurant", "cafe", "chai", "bakery"]`
     - **Transport**: `["uber", "ola", "rapido", "metro", "fuel", "petrol", "shell", "hpcl", "bpcl", "toll"]`
     - **Shopping**: `["amazon", "flipkart", "myntra", "ajio", "zara", "h&m", "dmart", "reliance"]`
     - **Entertainment**: `["bookmyshow", "netflix", "spotify", "prime", "hotstar", "cinema", "theatre", "steam"]`
     - **Utilities**: `["bescom", "electricity", "airtel", "jio", "vi", "water", "gas", "broadband", "bill"]`
   - Unmatched transactions default to `Other`, allowing manual override in the UI.
4. **Two-Step Import Architecture (Preview ➔ Commit)**:
   - **Step 1 (`POST /api/expenses/parse-gpay`)**: Parses the file and returns candidates with an `is_duplicate` flag by checking existing records in SQLite.
   - **Step 2 (`POST /api/expenses/bulk-add`)**: The user reviews the transactions in the frontend table, unchecks unwanted rows, adjusts categories, and submits only approved items for atomic batch insertion.
5. **Deduplication Strategy**:
   - In `models.bulk_create_expenses()`, incoming items are matched against existing records on `(user_id, date, amount, title)`.
   - Overlapping statements do not duplicate expenses, preserving data accuracy.

---

## 7. Authentication Architecture (Clerk RS256 Asymmetric JWT)

### Interview Question: *"How does authentication work between your React frontend and FastAPI backend?"*

#### The Flow:
1. **Frontend**: When the user signs in via Google OAuth on Clerk, Clerk generates an asymmetric RS256 JSON Web Token (JWT).
2. **Authorization Header**: Every Axios request sends:
   ```http
   Authorization: Bearer <clerk_jwt_token>
   ```
3. **Backend Verification (`auth.py`)**:
   - Downloads Clerk's public JSON Web Key Set (JWKS) from Clerk's dashboard endpoint.
   - Caches public RSA keys in memory to eliminate network overhead.
   - Verifies the signature of the incoming token using the public key (no shared secret needed!).
   - Extracts the authenticated user's unique ID (`sub` claim) and injects it into FastAPI route handlers via `user_id: str = Depends(get_current_user)`.
4. **Zero Shared Secrets**: Asymmetric cryptography means the backend never needs the user's password or sensitive master credentials.

---

## 8. High-Frequency Interview Questions & Senior Answers

### Q1: *"How do you handle multi-tenancy and prevent data leaks in a single database?"*
> **Answer**: *"We enforce multi-tenancy at both the application and database query levels. Every database model includes an indexed `user_id` column corresponding to the Clerk subject ID (`sub`). The FastAPI backend extracts `user_id` strictly from the cryptographically verified JWT bearer token via `Depends(get_current_user)`—the client can never pass an arbitrary user ID in the request body or query parameter. Every SQL query explicitly scopes to `WHERE user_id = :authenticated_user_id`. Furthermore, the frontend namespaces all browser cache keys (`spendwise_notifications_${userId}`) and resets React state whenever the active `userId` changes."*

### Q2: *"How would you migrate from SQLite to PostgreSQL in production?"*
> **Answer**: *"Because we used SQLAlchemy 2.0 with async engine abstractions, the application code contains zero raw SQLite SQL syntax. Migrating to PostgreSQL on Neon or Supabase requires only two changes:
> 1. Install the async PostgreSQL driver (`pip install asyncpg`).
> 2. Change the `DATABASE_URL` environment variable from `sqlite+aiosqlite:///./spendwise.db` to `postgresql+asyncpg://user:pass@host/dbname`.
> Our `database.py` connection factory even automatically normalizes standard `postgres://` URLs to `postgresql+asyncpg://`."*

### Q3: *"Why do you use a two-step preview modal for document imports instead of directly saving to the database?"*
> **Answer**: *"Financial data requires high trust and user agency. Automated OCR and regex parsers can encounter edge cases—such as an ambiguous merchant name or a split transaction. The preview step gives users full visibility: they see what was extracted, can deselect personal transfers they don't want tracked, and can correct categories before any record is committed to persistent storage. This pattern prevents garbage data from corrupting analytics."*

---

## 9. Fast Interview Cheat Sheet (Summary of Key Terms)

| Topic | Key Term | Explanation |
| :--- | :--- | :--- |
| **ORM** | SQLAlchemy 2.0 | Modern declarative Python ORM using `select()` and type-annotated `Mapped[]` columns. |
| **Async Driver** | `aiosqlite` | Non-blocking SQLite connector for Python's `asyncio` event loop. |
| **Dependency Injection** | `Depends(get_db)` | FastAPI pattern that provides an active DB session and guarantees cleanup via generator `yield`. |
| **Isolation** | `UniqueConstraint` | Database rule preventing duplicate monthly budgets per user. |
| **Cache Scoping** | Namespaced `localStorage` | Appending `userId` to cache keys to prevent multi-tenant cross-contamination. |
| **Backward Compatibility** | `.to_dict()` Bridge | Returning both `_id` and `id` in serializations to prevent breaking legacy frontend consumers. |
| **Doc Ingestion** | In-Memory Stream Parsing | Decoding byte streams via `pypdf` without saving sensitive financial documents to disk. |
| **Deduplication** | Compound Key Match | Comparing `(user_id, date, amount, title)` to reject duplicate statement records during bulk insert. |
