# app.py
# Main FastAPI application file.
#
# WHAT THIS FILE DOES:
# 1. Creates the FastAPI app instance with lifespan event handler
# 2. Adds CORS middleware (allowing the React frontend to communicate)
# 3. Automatically initializes database tables on startup
# 4. Mounts all API routes from routes.py

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import connect_db, disconnect_db
from routes import router

load_dotenv()


# ─────────────────────────────────────────────────────────────────────────────
# LIFECYCLE MANAGEMENT (LIFESPAN)
# Initializes DB tables on startup and disposes connections on shutdown.
# ─────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if not present
    await connect_db()
    print("🚀 SpendWise FastAPI server is running.")
    print("📖 API Docs: http://localhost:8000/docs")
    yield
    # Shutdown: Cleanly close DB connection pool
    await disconnect_db()


# ─────────────────────────────────────────────────────────────────────────────
# CREATE THE FASTAPI APP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="SpendWise Expense Tracker API",
    description=(
        "REST API for the SpendWise Expense Tracker application. "
        "Built with FastAPI, SQLAlchemy 2.0, and Clerk Auth."
    ),
    version="2.1.0",
    lifespan=lifespan,
)


# ─────────────────────────────────────────────────────────────────────────────
# CORS MIDDLEWARE
# ─────────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# ROOT ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "SpendWise API is running with SQLAlchemy. Visit /docs for the API documentation."
    }


# ─────────────────────────────────────────────────────────────────────────────
# REGISTER API ROUTES
# ─────────────────────────────────────────────────────────────────────────────

app.include_router(router)
