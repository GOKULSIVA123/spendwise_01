import os
from flask import Flask, jsonify
from pymongo import MongoClient
from dotenv import load_dotenv
from flask_cors import CORS
import certifi
import dns.resolver

# Force Google DNS to bypass ISP SRV block
dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
dns.resolver.default_resolver.nameservers = ['8.8.8.8']


mongo_client=None
db=None
def get_db():
    return db

from routes import routes   # Moved here to avoid circular import

def create_app():
    global mongo_client, db
    load_dotenv()
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    CORS(app)
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    try:
        mongo_client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
        db = mongo_client.expensetrackerdb04
        print("MongoDB connection is successful")
    except Exception as e:
        print("MongoDB connection issue:", e)
    @app.route("/")
    def hello():
        return "Hello"

    @app.route("/api/health_check")
    def healthcheck():
        try:
            mongo_client.admin.command("ping")
            return jsonify({"status": "ok", "dbconnected": True}), 200
        except Exception:
            return jsonify({"status": "error", "dbconnected": False}), 500

    # register your API routes (including /api/me)
    app.register_blueprint(routes)

    return app

app = create_app()
