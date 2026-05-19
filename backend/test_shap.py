import json
from dotenv import load_dotenv
load_dotenv()
from automl import run_pipeline

for ev in run_pipeline("workspace/uploads/a917beb440e4.csv"):
    step = ev.get("step")
    status = ev.get("status")
    if step == "shap" and status == "done":
        print("SHAP DATA:", json.dumps(ev["data"], indent=2))
    elif step == "evaluate" and status == "done":
        print("EVALUATE TASK TYPE:", ev["data"].get("task_type"))
        print("EVALUATE METRICS COUNT:", len(ev["data"].get("metrics", [])))
    elif status == "error":
        print("ERROR:", ev)
