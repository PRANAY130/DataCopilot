import json
from dotenv import load_dotenv
load_dotenv()
from firebase_admin_setup import init_firebase, get_db
from session_store import update_step

init_firebase()
db = get_db()
print("Firestore DB client:", db)

with open("test_binary_eval.json", "r") as f:
    eval_data = json.load(f)

print("Updating evaluate step...")
try:
    update_step("test-uid", "test-session", "evaluate", "done", eval_data)
    print("Update successful!")
except Exception as e:
    print("Exception during update:", e)
