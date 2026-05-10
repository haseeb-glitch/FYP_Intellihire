import os
import json
import re
import requests
from groq import Groq
from backend.config import Config

# Initialize Groq client
client = None
if Config.GROQ_API_KEY:
    client = Groq(api_key=Config.GROQ_API_KEY)

def call_llm(system_prompt, user_message):
    """
    Calls Groq first with a fallback to local Ollama.
    """
    # 1. Try Groq
    if client:
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                model=Config.GROQ_MODEL,
                temperature=0.7,
                stream=False
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"Groq API Error, falling back to Ollama: {e}")

    # 2. Fallback to Ollama
    if Config.USE_OLLAMA:
        try:
            url = "http://localhost:11434/api/chat"
            payload = {
                "model": Config.OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "stream": False
            }
            response = requests.post(url, json=payload, timeout=30)
            if response.status_code == 200:
                return response.json().get('message', {}).get('content', '')
            else:
                print(f"Ollama Error: Status {response.status_code}")
        except Exception as e:
            print(f"Ollama Connection Error: {e}")

    return "Error: Both Groq and Ollama failed."

def safe_parse_json(text):
    """
    Strips markdown code fences and parses JSON.
    Returns error dict on failure.
    """
    try:
        # Remove markdown code fences if present
        clean_text = re.sub(r'```json\s*|\s*```', '', text.strip(), flags=re.IGNORECASE)
        # Attempt to find the first '{' and last '}' to handle leading/trailing text
        start_idx = clean_text.find('{')
        end_idx = clean_text.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            json_text = clean_text[start_idx:end_idx + 1]
            return json.loads(json_text)
        
        return json.loads(clean_text)
    except Exception as e:
        print(f"JSON Parse Error: {e}")
        return {"error": "parse_failed", "raw": text}
