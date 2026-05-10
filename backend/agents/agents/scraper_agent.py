import os
import requests
import json
from backend.agents.llm_client import call_llm, safe_parse_json

def fetch_company_questions(company, role, difficulty='medium'):
    """
    Fetches real-world interview questions for a specific company and role using SerpAPI.
    Then uses Llama 3 to clean and structure the results.
    """
    api_key = os.getenv('SERPAPI_KEY')
    if not api_key:
        print("Warning: SERPAPI_KEY not found in environment.")
        return []

    # 1. Search for interview questions
    query = f"{company} {role} interview questions for {difficulty} level"
    search_url = "https://serpapi.com/search"
    params = {
        "q": query,
        "api_key": api_key,
        "engine": "google",
        "num": 10
    }

    try:
        response = requests.get(search_url, params=params)
        search_results = response.json()
        
        if 'error' in search_results:
            print(f"SerpAPI Error: {search_results['error']}")
            return []

        # Extract snippets from organic results
        snippets = []
        if 'organic_results' in search_results:
            for result in search_results['organic_results']:
                snippet = result.get('snippet')
                if snippet:
                    snippets.append(f"Source: {result.get('link')}\nSnippet: {snippet}")
        
        print(f"Collected {len(snippets)} snippets from SerpAPI.")
        
        if not snippets:
            print(f"No search results found for {company} {role}")
            return []

        # 2. Use LLM to extract and clean questions
        context = "\n\n".join(snippets)
        system_prompt = f"""You are an expert recruitment researcher. 
I will provide you with search result snippets about {company} {role} interview questions.
Your task is to extract exactly 5 relevant and realistic interview questions from this data.

Rules:
1. Only provide questions that are likely to be asked at {company} for the role of {role}.
2. Ensure the questions are diverse (technical, behavioral, or situational).
3. Provide the output in strict JSON format with a key named "questions".

Format:
{{
  "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
}}
"""
        user_message = f"Here is the search data:\n{context}\n\nPlease extract 5 questions in the specified JSON format."
        
        raw_response = call_llm(system_prompt, user_message)
        result = safe_parse_json(raw_response)
        
        if isinstance(result, dict) and "questions" in result:
            return result["questions"]
        return []

    except Exception as e:
        print(f"Scraper Agent Error: {e}")
        return []
