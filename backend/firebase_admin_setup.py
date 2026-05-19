"""
Firebase Admin SDK initialization.
Loads service account credentials from serviceAccountKey.json or env vars.
Falls back gracefully in DEV_MODE if credentials are not configured.
"""
import os
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

firebase_app = None
db = None  # Firestore client
_admin_auth = None  # Firebase Auth

DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"


def init_firebase():
    """Initialize Firebase Admin SDK. Call once at startup."""
    global firebase_app, db, _admin_auth

    if DEV_MODE:
        logger.warning("DEV_MODE=true — Firebase auth is BYPASSED. Not for production.")
        return

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore, auth as firebase_auth

        # Check if already initialized
        if firebase_admin._apps:
            db = firestore.client()
            _admin_auth = firebase_auth
            logger.info("Firebase Admin already initialized.")
            return

        # Option 1: JSON file path
        key_path = Path(os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json"))
        if key_path.exists():
            cred = credentials.Certificate(str(key_path))
        # Option 2: JSON string in env var (for Railway/Render deployment)
        elif os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON"):
            key_dict = json.loads(os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON"))
            cred = credentials.Certificate(key_dict)
        else:
            logger.warning(
                "No Firebase credentials found. "
                "Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON "
                "or set DEV_MODE=true to bypass auth."
            )
            return

        firebase_app = firebase_admin.initialize_app(cred)
        db = firestore.client()
        _admin_auth = firebase_auth
        logger.info("Firebase Admin SDK initialized successfully.")

    except Exception as e:
        logger.error(f"Firebase initialization failed: {e}")
        logger.warning("Falling back to DEV_MODE (no auth). Set DEV_MODE=true to suppress this.")


def get_db():
    """Get Firestore client. Returns None if not initialized."""
    return db


def get_auth():
    """Get Firebase Auth module. Returns None if not initialized."""
    return _admin_auth
