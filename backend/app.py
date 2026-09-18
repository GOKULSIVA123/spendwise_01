# app.py
# This is the main FastAPI application file — the equivalent of Flask's create_app().
#
# WHAT THIS FILE DOES:
# 1. Creates the FastAPI app instance
# 2. Adds CORS middleware (allows the React frontend to call this backend)
# 3. Registers startup and shutdown lifecycle events to connect/disconnect MongoDB
# 4. Mounts all API routes from routes.py
#
# KEY DIFFERENCES FROM FLASK:
# - Flask uses @app.before_first_request / MongoClient in create_app()
# - FastAPI uses @app.on_event("startup") / async Motor connect
# - Flask uses CORS(app) from flask-cors
# - FastAPI uses CORSMiddleware added with app.add_middleware(...)
# - Flask registers blueprints with app.register_blueprint(routes)
# - FastAPI includes routers with app.include_router(router)

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import connect_db, disconnect_db
from routes import router

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# CREATE THE FASTAPI APP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="SpendWise Expense Tracker API",
    description=(
        "REST API for the SpendWise Expense Tracker application. "
        "Handles expenses, monthly budgets, notifications, and AI insights. "
        "All endpoints (except /api/health_check) require Clerk JWT authentication."
    ),
    version="2.0.0",
    # Swagger UI available at: http://localhost:8000/docs
    # ReDoc available at:      http://localhost:8000/redoc
)


# ─────────────────────────────────────────────────────────────────────────────
# CORS MIDDLEWARE
# Allows the React frontend (usually at http://localhost:5173) to make requests.
# In production, replace "*" with your actual deployed frontend URL.
# ─────────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],              # React dev server + any deployed frontend
    allow_credentials=True,           # Allow cookies and auth headers
    allow_methods=["*"],              # Allow GET, POST, PUT, DELETE, OPTIONS
    allow_headers=["*"],              # Allow Authorization, Content-Type, etc.
)


# ─────────────────────────────────────────────────────────────────────────────
# LIFECYCLE EVENTS
# @app.on_event("startup")  — runs ONCE when uvicorn starts the server
# @app.on_event("shutdown") — runs ONCE when the server is stopped (Ctrl+C)
# ─────────────────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    """
    Connects to MongoDB Atlas when the server starts.
    This ensures the database connection is ready before any requests come in.
    """
    await connect_db()
    print("🚀 SpendWise FastAPI server is running.")
    print("📖 API Docs: http://localhost:8000/docs")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Cleanly disconnects from MongoDB when the server stops.
    Prevents dangling connections.
    """
    await disconnect_db()


# ─────────────────────────────────────────────────────────────────────────────
# ROOT ENDPOINT (quick sanity check)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint — returns a simple confirmation message.
    Visit http://localhost:8000/ in the browser to confirm the server is running.
    """
    return {"message": "SpendWise API is running. Visit /docs for the API documentation."}


# ─────────────────────────────────────────────────────────────────────────────
# REGISTER ALL API ROUTES
# Mounts every endpoint defined in routes.py under this FastAPI app.
# ─────────────────────────────────────────────────────────────────────────────

app.include_router(router)
