import firebase_admin

from firebase_admin import credentials
from firebase_admin import firestore


# =========================================================
# FIREBASE INITIALIZATION
# =========================================================

if not firebase_admin._apps:

    cred = credentials.Certificate(
        "serviceAccountKey.json"
    )

    firebase_admin.initialize_app(
        cred
    )


# =========================================================
# FIRESTORE CLIENT
# =========================================================

db = firestore.client()