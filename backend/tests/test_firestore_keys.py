import json
from dotenv import load_dotenv
load_dotenv()
from firebase_admin_setup import init_firebase, get_db
from session_store import _firestore_path

init_firebase()
db = get_db()
ref = _firestore_path("test-uid", "test-session")
if ref:
    ref.set({"status": "running"})

with open("test_binary_eval.json", "r") as f:
    eval_data = json.load(f)

for key, value in eval_data.items():
    print(f"Testing key: {key}")
    try:
        ref.update({f"steps.evaluate.data.{key}": value})
        print(f"  -> SUCCESS")
    except Exception as e:
        print(f"  -> FAILED: {e}")
