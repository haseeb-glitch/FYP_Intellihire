import random
from backend.agents.llm_client import call_llm

def generate_followup(question, answer, agent_type, domain):
    """
    Generates a contextual follow-up question based on the candidate's last answer.
    """
    system_prompt = f"""You are an expert {agent_type} Interviewer in the {domain} domain.
Based on the following interview question and the candidate's answer, generate ONE concise, insightful follow-up question.

Question: {question}
Candidate's Answer: {answer}

The follow-up should dig deeper into their reasoning or ask for a specific example.
"""
    
    try:
        followup = call_llm(system_prompt, f"Generate follow-up for: {answer}")
        return followup.strip()
    except Exception as e:
        print(f"Follow-up Generation Error: {e}")
        return "Can you elaborate more on that?"

def select_next_question(questions_pool, technical_score, stress_level, interview_mode):
    """
    Adaptive difficulty logic for selecting the next question from the pool.
    """
    # Difficulty hierarchy
    levels = ["easy", "medium", "hard"]
    
    # Simple logic to determine target difficulty
    # questions_pool is expected to be a dict: {"easy": [...], "medium": [...], "hard": [...]}
    
    current_difficulty = "medium" # Baseline
    
    if stress_level > 0.7:
        current_difficulty = "easy"
    elif technical_score < 5:
        current_difficulty = "easy"
    elif technical_score > 8 and stress_level < 0.3:
        current_difficulty = "hard"
    else:
        current_difficulty = "medium"

    # Fallback if pool for that difficulty is empty
    if not questions_pool.get(current_difficulty):
        for lv in levels:
            if questions_pool.get(lv):
                current_difficulty = lv
                break
                
    options = questions_pool.get(current_difficulty, [])
    if not options:
        # Emergency fallback
        return None
        
    return random.choice(options)
