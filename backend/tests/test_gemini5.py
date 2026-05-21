import os
import logging
from dotenv import load_dotenv
load_dotenv()
gemini_key = os.getenv('GEMINI_API_KEY')

try:
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=gemini_key)
    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents='Hello',
        config=types.GenerateContentConfig(
            system_instruction='You are a test assistant.',
        )
    )
    print('Response:', response.text)
except Exception as e:
    print('Error:', e)
