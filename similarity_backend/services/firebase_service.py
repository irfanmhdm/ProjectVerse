import os
import json
import firebase_admin

from firebase_admin import credentials
from firebase_admin import firestore


# =========================================================
# FIREBASE INITIALIZATION
# =========================================================

if not firebase_admin._apps:

    firebase_credentials = json.loads(
        os.environ["FIREBASE_SERVICE_ACCOUNT_JSON"]
    )

    cred = credentials.Certificate(firebase_credentials)

    firebase_admin.initialize_app(cred)


# =========================================================
# FIRESTORE CLIENT
# =========================================================

db = firestore.client()

print("Firebase connected successfully!")