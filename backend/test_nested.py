import json
from dotenv import load_dotenv
load_dotenv()
from firebase_admin_setup import init_firebase, get_db

init_firebase()
db = get_db()
print("Firestore:", db)

try:
    db.collection("test").document("test-nested").set({
        "cm": [[1,2],[3,4]]
    })
    print("SET SUCCESS!")
except Exception as e:
    print("SET FAILED:", e)

try:
    db.collection("test").document("test-nested").update({
        "cm2": [[1,2],[3,4]]
    })
    print("UPDATE SUCCESS!")
except Exception as e:
    print("UPDATE FAILED:", e)
