
import os
import json
import firebase_admin

from pathlib import Path
from dotenv import load_dotenv
from firebase_admin import credentials
from firebase_admin import firestore


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

load_dotenv(PROJECT_ROOT / ".env")


# =========================================================
# FIREBASE INITIALIZATION
# =========================================================

if not firebase_admin._apps:

    service_account_value = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_JSON"
    )

    if not service_account_value:
        raise RuntimeError(
            "FIREBASE_SERVICE_ACCOUNT_JSON is missing from .env"
        )

    # Support either JSON content or a JSON file path.
    if service_account_value.strip().startswith("{"):
        firebase_credentials = json.loads(service_account_value)
    else:
        service_account_path = Path(service_account_value)

        if not service_account_path.is_absolute():
            service_account_path = PROJECT_ROOT / service_account_path

        with open(service_account_path, "r", encoding="utf-8") as file:
            firebase_credentials = json.load(file)

    cred = credentials.Certificate(firebase_credentials)

    firebase_admin.initialize_app(cred)


# =========================================================
# FIRESTORE CLIENT
# =========================================================

db = firestore.client()

print("Firebase connected successfully!")
