"""
FastAPI dependency that verifies Firebase ID tokens.
In DEV_MODE, bypasses auth and returns a fake user for local testing.
"""
import os
import logging
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin_setup import get_auth, DEV_MODE

logger = logging.getLogger(__name__)
_bearer = HTTPBearer(auto_error=False)

DEV_UID = "dev-user-local"  # Fake UID used in DEV_MODE


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> str:
    """
    FastAPI dependency. Returns the Firebase UID of the authenticated user.
    Use as: uid = Depends(get_current_user)
    """
    if DEV_MODE:
        return DEV_UID

    if credentials is None:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    token = credentials.credentials
    firebase_auth = get_auth()

    if firebase_auth is None:
        raise HTTPException(
            status_code=503,
            detail="Firebase Auth not configured. Set DEV_MODE=true for local development.",
        )

    try:
        decoded = firebase_auth.verify_id_token(token, clock_skew_seconds=60)
        return decoded["uid"]
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


async def get_current_user_ws(token: str | None) -> str:
    """
    WebSocket variant — token passed as query param ?token=...
    """
    if DEV_MODE:
        return DEV_UID

    if not token:
        raise HTTPException(status_code=401, detail="Token missing from WebSocket query")

    firebase_auth = get_auth()
    if firebase_auth is None:
        return DEV_UID  # Fallback in case Firebase isn't configured

    try:
        decoded = firebase_auth.verify_id_token(token, clock_skew_seconds=60)
        return decoded["uid"]
    except Exception as e:
        logger.warning(f"WS token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid WebSocket token")
