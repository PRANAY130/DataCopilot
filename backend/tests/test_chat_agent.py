import os
import sys
sys.path.append(os.path.abspath('.'))
from dotenv import load_dotenv
load_dotenv()
from chat_agent import get_chat_response

session = {
    'filename': 'titanic.csv',
    'steps': {
        'task': {'data': {'task_type': 'Classification', 'target_col': 'Survived'}},
        'evaluate': {'data': {'best_model': 'XGBoost', 'metrics': [{'model': 'XGBoost', 'accuracy': 0.85, 'is_best': True}]}},
        'shap': {'data': {'features': [{'name': 'Sex_female', 'importance': 0.5}]}}
    }
}

try:
    response = get_chat_response(session, 'What is the best model?')
    print('Response:', response)
except Exception as e:
    print('Error:', e)
