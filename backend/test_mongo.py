import os
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi

load_dotenv()
mongo_uri = os.getenv("MONGO_URI")

try:
    print("Testing connection...")
    client = MongoClient(mongo_uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    # The ismaster command is cheap and does not require auth.
    client.admin.command('ismaster')
    print("MongoDB connection successful!")
except Exception as e:
    print(f"MongoDB Error: {e}")
