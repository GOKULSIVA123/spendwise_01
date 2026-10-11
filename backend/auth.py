# auth.py
# This file verifies the Clerk JWT token that the React frontend sends
# in every API request's Authorization header.
#
# HOW IT WORKS:
# 1. The React frontend calls Clerk's getToken() to get a signed JWT string.
# 2. React sends: "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..."
# 3. This file reads that token, downloads Clerk's public keys (JWKS),
#    and verifies the token's signature is genuinely from Clerk.
# 4. If valid, it extracts the user's unique ID ("sub" field) from the token.
# 5. FastAPI injects this user_id into any route function that uses Depends(get_current_user).
#
# DIFFERENCE FROM FLASK:
# Flask used @token_required as a decorator.
# FastAPI uses Depends(get_current_user) as a function parameter — much cleaner!

import os
import requests
import jwt
from jwt import algorithms as jwt_algorithms
from jwt.exceptions import PyJWTError
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

load_dotenv()

CLERK_FRONTEND_API = os.getenv("CLERK_FRONTEND_API", "https://known-catfish-97.clerk.accounts.dev")
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", f"{CLERK_FRONTEND_API}/.well-known/jwks.json")
CLERK_ISSUER_URL = os.getenv("CLERK_ISSUER_URL", CLERK_FRONTEND_API)

# Cache for Clerk's public RSA keys — fetched once, reused for all requests
_PUBLIC_KEYS: dict = {}

# HTTPBearer tells FastAPI to automatically read the "Authorization: Bearer <token>"
# header from every incoming request
security = HTTPBearer()


def _get_public_keys() -> dict:
    """
    Downloads Clerk's public JSON Web Key Set (JWKS) from the Clerk dashboard URL.
    These public keys are used to verify the JWT token signature.
    Keys are cached in memory so we don't make a network request on every API call.
    """
    global _PUBLIC_KEYS

    # Return cached keys if already loaded
    if _PUBLIC_KEYS:
        return _PUBLIC_KEYS

    try:
        response = requests.get(CLERK_JWKS_URL, timeout=10)
        response.raise_for_status()
        jwks = response.json()

        # Convert each JWK key object into a Python RSA public key object
        for key in jwks.get("keys", []):
            kid = key.get("kid")  # "kid" = key identifier
            public_key = jwt_algorithms.RSAAlgorithm.from_jwk(key)
            _PUBLIC_KEYS[kid] = public_key

        print(f"✅ Loaded {len(_PUBLIC_KEYS)} Clerk public key(s)")
    except Exception as e:
        print(f"❌ Failed to load Clerk JWKS public keys: {e}")

    return _PUBLIC_KEYS


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    FastAPI Security Dependency — runs automatically on every protected route.

    How to use in a route:
        @router.get("/api/expenses")
        async def list_expenses(user_id: str = Depends(get_current_user)):
            # user_id is now the Clerk user ID (e.g. "user_2pX...")

    Returns:
        str: The authenticated Clerk user's unique ID (the "sub" field from JWT payload).

    Raises:
        HTTPException 401: If token is missing, expired, or fails signature verification.
    """
    token = credentials.credentials  # Extract raw JWT string from "Bearer <token>"

    try:
        # Load Clerk's public keys for signature verification
        keys = _get_public_keys()
        if not keys:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not fetch Clerk public keys for verification."
            )

        # Read the "kid" (key ID) from the JWT header to select the correct public key
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        public_key = keys.get(kid)

        if public_key is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: signing key not found."
            )

        # Verify and decode the JWT token using the RSA public key
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False},  # Clerk frontend tokens don't use "aud"
            issuer=CLERK_ISSUER_URL,
            leeway=60,                      # Allow 60 seconds of clock skew
        )

        # Extract and return the Clerk user ID from the token payload
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing user ID."
            )

        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again."
        )
    except PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal auth error: {str(e)}"
        )
