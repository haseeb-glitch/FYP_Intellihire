import re
from backend.agents.llm_client import call_llm, safe_parse_json

def evaluate_answer(question, answer, expected_keywords, ideal_answer_hint):
    """
    Evaluates an answer based on keyword presence and semantic relevance.
    """
    
    # 1. Keyword Coverage
    if not expected_keywords:
        keyword_coverage = 1.0
    else:
        found_count = 0
        answer_lower = answer.lower()
        for kw in expected_keywords:
            # Use regex for word boundary matching
            if re.search(rf'\b{re.escape(kw.lower())}\b', answer_lower):
                found_count += 1
        keyword_coverage = found_count / len(expected_keywords)

    # 2. Semantic Relevance (LLM)
    system_prompt = f"""You are a Linguistics and Subject Matter Expert.
Evaluate the semantic relevance of the candidate's answer based on the question and the ideal answer hint provided.

Question: {question}
Ideal Answer Hint: {ideal_answer_hint}
Candidate's Answer: {answer}

Provide your score ONLY in the following JSON format:
{{
  "semantic_relevance": float (0-10),
  "rationale": "string"
}}
"""
    
    try:
        raw_response = call_llm(system_prompt, f"Evaluate relevance for Answer: {answer}")
        result = safe_parse_json(raw_response)
        semantic_relevance = float(result.get("semantic_relevance", 5.0))
    except Exception as e:
        print(f"Semantic Evaluation Error: {e}")
        semantic_relevance = 5.0

    # 3. Combined Score (0-10)
    # Weighted: 40% Keyword Coverage, 60% Semantic Relevance
    combined_score = (keyword_coverage * 10 * 0.4) + (semantic_relevance * 0.6)
    combined_score = round(combined_score, 2)

    return {
        "keyword_coverage": round(keyword_coverage, 2),
        "semantic_relevance": semantic_relevance,
        "combined_score": combined_score
    }
