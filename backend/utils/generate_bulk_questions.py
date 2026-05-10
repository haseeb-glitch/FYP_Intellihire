import sys
import os
import time

# Add the parent directory to sys.path to allow importing backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend import create_app, db
from backend.models.interview import QuestionBank
from backend.agents.llm_client import call_llm, safe_parse_json
from backend.utils.constants import SUPPORTED_DOMAINS

def generate_questions_for_domain(domain):
    """Generates 50 questions for a given domain using LLM."""
    print(f"Generating questions for: {domain}...")
    
    # We'll ask for 15 easy, 20 medium, 15 hard = 50 total
    prompts = [
        ("easy", 15),
        ("medium", 20),
        ("hard", 15)
    ]
    
    all_generated = []
    
    for diff, count in prompts:
        system_prompt = f"You are an expert interviewer for the field of {domain}."
        user_message = f"""Generate exactly {count} {diff} difficulty interview questions for the domain: {domain}.
Include a mix of technical, situational, and behavioral questions relevant to this specific role.

Output strict JSON format:
{{
  "questions": [
    {{"text": "question 1", "type": "technical", "subtype": "knowledge"}},
    ...
  ]
}}
"""
        try:
            raw_response = call_llm(system_prompt, user_message)
            result = safe_parse_json(raw_response)
            
            if isinstance(result, dict) and "questions" in result:
                for q in result["questions"]:
                    all_generated.append({
                        "text": q.get("text"),
                        "type": q.get("type", "technical"),
                        "subtype": q.get("subtype", "knowledge"),
                        "difficulty": diff
                    })
            time.sleep(1) # Small delay to avoid aggressive rate limiting
        except Exception as e:
            print(f"Error generating {diff} questions for {domain}: {e}")

    return all_generated

def bulk_seed():
    app = create_app()
    with app.app_context():
        for domain in SUPPORTED_DOMAINS:
            if domain == "General":
                continue
                
            domain_key = domain.lower().replace(" ", "_")
            
            # Check if we already have questions for this domain
            existing_count = QuestionBank.query.filter_by(domain=domain_key).count()
            if existing_count >= 40:
                print(f"Domain {domain} already has {existing_count} questions. Skipping.")
                continue
                
            questions = generate_questions_for_domain(domain)
            
            added = 0
            for q in questions:
                if not q.get("text"): continue
                
                # Check for duplicates
                exists = QuestionBank.query.filter_by(
                    question_text=q["text"],
                    domain=domain_key
                ).first()
                
                if not exists:
                    new_q = QuestionBank(
                        category=q["type"],
                        domain=domain_key,
                        difficulty=q["difficulty"],
                        question_text=q["text"],
                        question_type=q["type"],
                        subtype=q["subtype"],
                        requires_code=(q["type"] == "technical" and "code" in q["text"].lower())
                    )
                    db.session.add(new_q)
                    added += 1
            
            db.session.commit()
            print(f"Added {added} new questions for {domain}.")

if __name__ == '__main__':
    bulk_seed()
