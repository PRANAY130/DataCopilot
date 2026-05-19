import json
import pandas as pd
import numpy as np
from automl import run_pipeline

# Create binary classification dataset
df = pd.DataFrame({
    "Age": np.random.randint(20, 80, 100),
    "BMI": np.random.uniform(18.5, 40.0, 100),
    "Glucose": np.random.randint(70, 200, 100),
    "Target": np.random.choice(["M", "B"], 100)
})
df.to_csv("workspace/uploads/test_binary.csv", index=False)

for event in run_pipeline("workspace/uploads/test_binary.csv"):
    if event["step"] == "evaluate" and event["status"] == "done":
        print("EVALUATE DONE:", json.dumps(event["data"], indent=2))
    elif event["step"] == "shap" and event["status"] == "done":
        print("SHAP DONE, features:", len(event["data"].get("features", [])))
    elif event["status"] == "error":
        print("ERROR:", event)
