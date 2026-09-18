# database.py
# This file sets up the async MongoDB connection using Motor.
# Motor is the async version of PyMongo — it works perfectly with FastAPI
# because both use Python's asyncio event loop.
#
# KEY DIFFERENCE from old code:
# OLD (Flask + PyMongo):  db = MongoClient(uri).expensetrackerdb04
# NEW (FastAPI + Motor):  db = AsyncIOMotorClient(uri).expensetrackerdb04
#
# The only rule: every database operation must now use "await" before it.

import os
import certifi
import dns.resolver
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Force Google DNS to bypass ISP SRV record block (same fix as Flask version)
dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
dns.resolver.default_resolver.nameservers = ["8.8.8.8"]

# Read MongoDB URI from .env file
MONGO_URI = os.getenv("MONGO_URI")

# Create the async MongoDB client (Motor)
# certifi.where() provides the SSL certificate bundle for MongoDB Atlas TLS
motor_client: AsyncIOMotorClient = None

# This is our database object — same as before, just async now
db = None


def get_db():
    """
    Returns the active database instance.
    Used in routes.py and models.py to access MongoDB collections.
    Collections available:
        db.expenses       - All user transactions
        db.budgets        - Monthly budget settings per user
        db.notifications  - System notification feed per user
    """
    return db


async def connect_db():
    """
    Called once when the FastAPI app starts up (via @app.on_event("startup")).
    Creates the Motor async client and connects to MongoDB Atlas.
    """
    global motor_client, db
    try:
        motor_client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
        db = motor_client.expensetrackerdb04
        # Ping the database to confirm the connection is alive
        await motor_client.admin.command("ping")
        print("✅ MongoDB Atlas connected successfully (Motor Async)")
    except Exception as e:
        print(f"❌ MongoDB connection error: {e}")


async def disconnect_db():
    """
    Called once when the FastAPI app shuts down (via @app.on_event("shutdown")).
    Cleanly closes the Motor connection to avoid resource leaks.
    """
    global motor_client
    if motor_client:
        motor_client.close()
        print("✅ MongoDB connection closed")
