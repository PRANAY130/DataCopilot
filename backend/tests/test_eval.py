import json
from automl import run_pipeline

for event in run_pipeline("workspace/uploads/59acf6a95643.csv"):
    if event["step"] == "evaluate" and event["status"] == "done":
        print("EVALUATE DONE:", json.dumps(event["data"], indent=2))
    elif event["status"] == "error":
        print("ERROR:", event)
