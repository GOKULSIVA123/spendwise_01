import os
import requests
from flask import json, jsonify, request
from functools import wraps
import jwt
from jwt import algorithms as jwt_algorithms
from jwt.exceptions import PyJWTError
from dotenv import load_dotenv

load_dotenv()

CLERK_FRONTEND_API = os.getenv("CLERK_FRONTEND_API")
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
PUBLIC_KEYS = {}


def get_publickey():
    if PUBLIC_KEYS:
        return PUBLIC_KEYS
    try:
        response = requests.get(CLERK_JWKS_URL)
        response.raise_for_status()
        jwks = response.json()
        print(jwks)
        for key in jwks.get("keys", []):
            kid = key.get("kid")
            print("key", key)
            public_key = jwt_algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
            PUBLIC_KEYS[kid] = public_key
    except Exception as e:
        print(f"ERROR: Invalid JWKS structure or processing error: {e}")
        return None
    return PUBLIC_KEYS
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # 1. Get Bearer token
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"message": "Authorization token is missing or invalid!"}), 401
        print(auth_header)
        token = auth_header.split(" ", 1)[1]

        try:
            # 2. Load public keys
            keys = get_publickey()
            if not keys:
                return jsonify({"message": "Could not fetch public keys for verification."}), 500

            # 3. Get kid from header
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            public_key = keys.get(kid)
            if public_key is None:
                return jsonify({"message": "Invalid token: Signing key not found."}), 401
            issuer_url = os.getenv("CLERK_ISSUER_URL")
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                options={"verify_aud": False}, # Clerk often doesn't use aud for frontend tokens
                issuer=issuer_url, # Will verify if issuer_url is not None
                leeway=60 # Allow 60 seconds of clock skew
            )
            # 5. Attach user id to request
            request.user_id = payload.get("sub")

        except jwt.ExpiredSignatureError as e:
            print(f"Auth Error (Expired): {e}")
            return jsonify({"message": "Token has expired. Please log in again."}), 401
        except PyJWTError as e:
            print(f"Auth Error (Verification): {e}")
            return jsonify({"message": f"Token verification failed: {str(e)}"}), 401
        except Exception as e:
            print(f"Auth Error (General): {e}")
            return jsonify({"message": "Internal verification error."}), 500

        return f(*args, **kwargs)
    return decorated
