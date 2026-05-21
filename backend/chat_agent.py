"""
LangChain conversational agent for answering questions about analysis results.
Uses Gemini as primary LLM, falls back to Groq if unavailable.
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def _build_system_prompt(session: dict) -> str:
    """Build a context-rich system prompt from session results."""
    steps = session.get("steps", {})
    task_data = steps.get("task", {}).get("data", {})
    evaluate_data = steps.get("evaluate", {}).get("data", {})
    shap_data = steps.get("shap", {}).get("data", {})
    preprocess_data = steps.get("preprocess", {}).get("data", {})
    analyze_data = steps.get("analyze", {}).get("data", {})

    # Build metrics string
    metrics_str = ""
    for m in evaluate_data.get("metrics", []):
        if task_data.get("task_type") == "Regression":
            metrics_str += f"  - {m['model']}: R²={m.get('r2')}, MAE={m.get('mae')}, RMSE={m.get('rmse')}"
        else:
            metrics_str += f"  - {m['model']}: Accuracy={m.get('accuracy')}, F1={m.get('f1')}, AUC={m.get('auc')}"
        if m.get("is_best"):
            metrics_str += " ← BEST MODEL"
        metrics_str += "\n"

    # Build SHAP string
    shap_str = ""
    for f in shap_data.get("features", [])[:8]:
        shap_str += f"  - {f['name']}: {f.get('importance')}\n"

    # Build preprocessing string
    prep_str = ""
    for t in preprocess_data.get("transforms", [])[:6]:
        prep_str += f"  - {t['action']} on '{t['column']}': {t['detail']}\n"

    # Null summary
    null_str = ""
    for col in analyze_data.get("per_column", []):
        if col.get("null_pct", 0) > 0:
            null_str += f"  - {col['name']}: {col['null_pct']}% missing\n"

    return f"""You are DataCopilot, an expert AI data scientist assistant.
You have just analyzed the dataset: {session.get('filename', 'unknown')}.

ANALYSIS RESULTS:
- Task Type: {task_data.get('task_type', 'Unknown')}
- Target Column: {task_data.get('target_col', 'Unknown')}
- Class Distribution: {task_data.get('class_counts', {})}

MODEL PERFORMANCE:
{metrics_str}
Best Model: {evaluate_data.get('best_model', 'Unknown')}

TOP FEATURE IMPORTANCES (SHAP):
{shap_str}

DATA PREPROCESSING APPLIED:
{prep_str}

MISSING DATA SUMMARY:
{null_str if null_str else "  No significant missing data."}

INSTRUCTIONS:
- Answer questions specifically about THIS dataset and analysis.
- Be concise and technical but understandable.
- If asked for improvement suggestions, be specific and actionable.
- Reference actual numbers from the analysis above.
- Do NOT hallucinate data — only use what is provided above.
"""


def get_chat_response(session: dict, user_message: str) -> str:
    """
    Get an AI response to the user's question about their analysis.
    Returns a string response.
    """
    system_prompt = _build_system_prompt(session)

    # Try Gemini first
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and gemini_key != "your_gemini_api_key_here":
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=gemini_key)
            response = client.models.generate_content(
                model='gemini-3.5-flash',
                contents=user_message,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                )
            )
            return response.text
        except Exception as e:
            logger.warning(f"Gemini API failed: {e}. Trying Groq...")

    # Fallback to Groq
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and groq_key != "your_groq_api_key_here":
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                max_tokens=1024,
            )
            return completion.choices[0].message.content
        except Exception as e:
            logger.warning(f"Groq API failed: {e}")

    # No LLM configured — return contextual fallback
    return _rule_based_response(session, user_message)


def _rule_based_response(session: dict, message: str) -> str:
    """Basic rule-based responses when no LLM is configured."""
    msg_lower = message.lower()
    steps = session.get("steps", {})
    evaluate_data = steps.get("evaluate", {}).get("data", {})
    shap_data = steps.get("shap", {}).get("data", {})

    best_model = evaluate_data.get("best_model", "the top model")
    top_feature = (shap_data.get("features") or [{}])[0].get("name", "the top feature")

    if "why" in msg_lower and "model" in msg_lower:
        return (f"{best_model} was selected because it achieved the highest cross-validation score "
                f"across all folds. For tabular datasets, gradient boosting models like XGBoost "
                f"typically outperform others due to their ability to capture non-linear interactions.")

    if "feature" in msg_lower or "important" in msg_lower or "shap" in msg_lower:
        features = shap_data.get("features", [])[:3]
        names = ", ".join(f['name'] for f in features)
        return (f"The most important features are: {names}. "
                f"{top_feature} has the highest SHAP value, meaning it contributes most to predictions.")

    if "improve" in msg_lower or "accuracy" in msg_lower or "better" in msg_lower:
        return (f"To improve performance: (1) Engineer new features from existing ones, "
                f"(2) Try hyperparameter tuning with a wider grid search, "
                f"(3) Apply SMOTE if the dataset is imbalanced, "
                f"(4) Collect more training data for underrepresented classes.")

    if "preprocess" in msg_lower or "clean" in msg_lower:
        transforms = steps.get("preprocess", {}).get("data", {}).get("transforms", [])
        if transforms:
            summary = "; ".join(f"{t['action']} on {t['column']}" for t in transforms[:3])
            return f"The preprocessing pipeline applied: {summary}. Each transformation was selected automatically based on data type and null patterns."

    return (f"I've analyzed your dataset ({session.get('filename', 'your file')}). "
            f"The best model is {best_model}. "
            f"Feel free to ask about feature importance, model selection rationale, "
            f"preprocessing steps, or how to improve results. "
            f"(Tip: Add your GEMINI_API_KEY to .env for full AI-powered responses.)")


def generate_shap_insight(session: dict) -> str:
    """Generate a one-line AI insight about SHAP results (called at end of pipeline)."""
    steps = session.get("steps", {})
    shap_data = steps.get("shap", {}).get("data", {})
    task_data = steps.get("task", {}).get("data", {})
    evaluate_data = steps.get("evaluate", {}).get("data", {})

    features = shap_data.get("features", [])
    if not features:
        return "Analysis complete. Check the SHAP section for feature importance details."

    top = features[0]
    best = evaluate_data.get("best_model", "the best model")
    target = task_data.get("target_col", "the target")

    prompt = (
        f"In one sentence, explain why '{top['name']}' (SHAP={top['importance']}) "
        f"is the most important feature for predicting '{target}' in this {task_data.get('task_type', '')} task "
        f"using {best}."
    )

    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and gemini_key != "your_gemini_api_key_here":
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            return model.generate_content(prompt).text.strip()
        except Exception:
            pass

    return (f"'{top['name']}' is the strongest predictor of '{target}' "
            f"with a SHAP importance of {top['importance']}, "
            f"indicating it has the largest average impact on {best}'s predictions.")
