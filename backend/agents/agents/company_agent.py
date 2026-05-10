import requests
from backend.config import Config
from backend.agents.llm_client import call_llm, safe_parse_json

def fetch_company_info(company, domain, job_role):
    """
    Fetches company information using SerpAPI or LLM fallback.
    """

    # 1. Try SerpAPI if key exists
    if Config.SERPAPI_KEY:
        try:
            params = {
                "q": f"{company} company culture values tech stack for {job_role}",
                "api_key": Config.SERPAPI_KEY,
                "engine": "google"
            }
            response = requests.get("https://serpapi.com/search", params=params, timeout=10)
            if response.status_code == 200:
                search_results = response.json().get("organic_results", [])[:3]
                # Use LLM to summarize results into required JSON format
                summary_prompt = f"""Summarize these search results for {company} into a structured format.
Results: {search_results}
"""
                system_prompt = f"""You are a Corporate Research Assistant.
Extract and summarize the following for {company} in {domain} for a {job_role}:
- company_values (list)
- culture (string)
- tech_stack (list)
- common_interview_themes (list)
- role_expectations (string)

Return strict JSON.
"""
                raw_summary = call_llm(system_prompt, f"Data: {search_results}")
                return safe_parse_json(raw_summary)
        except Exception as e:
            print(f"SerpAPI Error: {e}")

    # 2. LLM Fallback (Zero-shot Knowledge)
    system_prompt = f"""You are an expert Corporate Researcher.
Generate a realistic profile for {company} in the {domain} sector for the role of {job_role}.
If the company is fictional or obscure, use industry standards for {domain}.

Return strict JSON with:
- company_values (list)
- culture (string)
- tech_stack (list)
- common_interview_themes (list)
- role_expectations (string)
"""
    raw_info = call_llm(system_prompt, f"Generate profile for {company}")
    return safe_parse_json(raw_info)

def evaluate_company_fit(all_answers, company_info, domain, job_role, answer_mode):
    """
    Evaluates the aggregate fit of a candidate based on all their answers and company profile.
    """

    system_prompt = f"""You are a Strategic Recruitment Consultant.
Evaluate the candidate's aggregate cultural and role fit.
Company Profile: {company_info}
Job Role: {job_role}
Domain: {domain}

Candidate's Interview Summary: {all_answers}

Provide your evaluation in strict JSON format with the following keys:
- culture_fit_score (float 0-10)
- role_fit_score (float 0-10)
- overall (float 0-10)
- alignment_highlights (list of strings)
- misalignment_concerns (list of strings)
- feedback (string)
"""

    user_message = "Perform the company fit analysis."

    try:
        raw_response = call_llm(system_prompt, user_message)
        result = safe_parse_json(raw_response)

        if "error" in result:
            raise ValueError("LLM response parsing failed")

        return result
    except Exception as e:
        print(f"Company Agent Error: {e}")
        return {
            "culture_fit_score": 5.0,
            "role_fit_score": 5.0,
            "overall": 5.0,
            "alignment_highlights": [],
            "misalignment_concerns": ["Agent error occurred"],
            "feedback": "Unable to perform cultural fit analysis at this time."
        }
