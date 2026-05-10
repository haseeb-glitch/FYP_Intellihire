import os
import sys
import json
import time
import random
from datetime import datetime

# Add the parent directory to sys.path to allow importing backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend import create_app, db
from backend.models.interview import QuestionBank
from backend.agents.llm_client import call_llm, safe_parse_json
from backend.utils.constants import SUPPORTED_DOMAINS, DIFFICULTY_LEVELS

def generate_batch(domain, difficulty, category, count=20):
    """
    Generates a batch of interview questions using LLM.
    """
    system_prompt = f"""You are an Expert Interviewer specializing in {domain}.
Generate a list of {count} unique interview questions for the following criteria:
- Domain: {domain}
- Difficulty: {difficulty}
- Category: {category} (can be 'technical', 'hr', or 'stress')

The questions should be high-quality and professional.
- For 'technical': Focus on core concepts, problem-solving, and domain-specific knowledge.
- For 'hr': Focus on behavioral, situational, and cultural fit.
- For 'stress': Focus on handling difficult situations, ethics, and pressure.

Return your response in STRICT JSON format:
{{
    "questions": [
        {{
            "text": "The question text here",
            "subtype": "a brief subtype e.g. coding, conceptual, situational",
            "requires_code": false
        }},
        ...
    ]
}}
"""
    
    user_message = f"Generate {count} {difficulty} level {category} questions for {domain}."
    
    try:
        raw_response = call_llm(system_prompt, user_message)
        data = safe_parse_json(raw_response)
        return data.get('questions', [])
    except Exception as e:
        print(f"Error generating batch for {domain}/{difficulty}/{category}: {e}")
        return []

def run_generator(domains=None, questions_per_domain=500):
    """
    Main generator loop.
    """
    app = create_app()
    with app.app_context():
        target_domains = domains or SUPPORTED_DOMAINS
        
        for domain in target_domains:
            print(f"Starting generation for domain: {domain}")
            
            # We need to split 500 questions into categories and difficulties
            # E.g. 150 Technical, 150 HR, 100 Stress, 100 General
            # Mix difficulties: 30% Easy, 40% Medium, 30% Hard
            
            categories = ['technical', 'hr', 'stress']
            difficulties = ['easy', 'medium', 'hard']
            
            total_saved = 0
            
            for category in categories:
                for diff in difficulties:
                    # Calculate how many questions to generate for this combination
                    # This is a simple distribution to reach the target
                    batch_size = 20
                    target_for_combo = questions_per_domain // (len(categories) * len(difficulties))
                    
                    print(f"  - Generating {diff} {category} questions...")
                    
                    generated_count = 0
                    while generated_count < target_for_combo:
                        questions = generate_batch(domain, diff, category, count=batch_size)
                        
                        if not questions:
                            print("    Failed to get questions from LLM, retrying...")
                            time.sleep(2)
                            continue
                            
                        new_count = 0
                        for q in questions:
                            # Check for duplicates (basic text match)
                            text = q.get('text', '')
                            if not text: continue
                            
                            existing = QuestionBank.objects(question_text=text, domain=domain.lower().replace(" ", "_")).first()
                            if not existing:
                                new_q = QuestionBank(
                                    category=category,
                                    domain=domain.lower().replace(" ", "_"),
                                    difficulty=diff,
                                    question_text=text,
                                    question_type=category,
                                    subtype=q.get('subtype', 'behavioural'),
                                    requires_code=q.get('requires_code', False)
                                )
                                new_q.save()
                                new_count += 1
                        
                        generated_count += len(questions)
                        total_saved += new_count
                        print(f"    Saved {new_count} new questions (Total for {domain}: {total_saved})")
                        
                        # Rate limiting protection
                        time.sleep(1)
                        
                        if total_saved >= questions_per_domain:
                            break
                if total_saved >= questions_per_domain:
                    break

            print(f"Completed {domain}! Total questions in DB for this domain: {total_saved}")

if __name__ == '__main__':
    # Default: Generate 100 questions per domain for now to keep it manageable
    # The user can run it again to reach 500-600
    import argparse
    parser = argparse.ArgumentParser(description='Bulk Question Generator')
    parser.add_argument('--domains', nargs='+', help='List of domains to generate for')
    parser.add_argument('--count', type=int, default=100, help='Questions per domain')
    
    args = parser.parse_args()
    
    run_generator(domains=args.domains, questions_per_domain=args.count)
