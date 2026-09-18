# run.py
# This is the script you run to start the FastAPI backend server.
# 
# HOW TO START THE SERVER:
#   python run.py
#
# Or directly with uvicorn (same thing):
#   uvicorn app:app --reload --host 0.0.0.0 --port 8000
#
# DIFFERENCE FROM FLASK:
# Flask used:  app.run(debug=True)   → Werkzeug dev server
# FastAPI uses: uvicorn.run(...)     → ASGI production-grade server
#
# --reload: Auto-restarts the server when you save any Python file (dev mode)
# --host 0.0.0.0: Makes it accessible from other devices on the same network
# --port 8000: Backend runs at http://localhost:8000
#
# AFTER STARTING:
# API Docs (Swagger UI): http://localhost:8000/docs
# Alternative Docs (ReDoc): http://localhost:8000/redoc
# Health Check: http://localhost:8000/api/health_check

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app:app",       # "filename:FastAPI-instance-name" → app.py -> app
        host="0.0.0.0",  # Listen on all network interfaces
        port=8000,        # Port number
        reload=True,      # Auto-reload on code changes (disable in production)
    )
