"""
LLM Client — The shared "phone line" all agents use to call the AI.
Supports Groq API (primary) with Ollama fallback (local).
"""

import os
import json
import re
import requests
from groq import Groq
from backend.config import Config

# Global client instance
_client = None

def get_groq_client():
    global _client
    if _client is None:
        api_key = Config.GROQ_API_KEY or os.environ.get("GROQ_API_KEY")
        if api_key:
            try:
                _client = Groq(api_key=api_key)
                print("DEBUG: Groq client initialized successfully.")
            except Exception as e:
                print(f"DEBUG: Failed to initialize Groq client: {e}")
        else:
            print("DEBUG: GROQ_API_KEY not found in Config or Environment.")
    return _client

def call_llm(system_prompt, user_message):
    """
    Calls Groq API first with a fallback to local Ollama.
    All 5 agents use this single function.
    """
    client = get_groq_client()

    # 1. Try Groq
    if client:
        try:
            # Ensure the prompt mentions JSON to satisfy Groq's json_object requirement
            if "JSON" not in system_prompt.upper():
                system_prompt += "\nRespond in strict JSON format."

            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                model=Config.GROQ_MODEL or "llama-3.1-8b-instant",
                temperature=0.7,
                stream=False,
                response_format={"type": "json_object"}
            )
            content = chat_completion.choices[0].message.content
            if not content:
                raise ValueError("Groq returned an empty response")
            return content
        except Exception as e:
            print(f"DEBUG: Groq API Error: {e}")
            print("DEBUG: Falling back to Ollama or returning error...")

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