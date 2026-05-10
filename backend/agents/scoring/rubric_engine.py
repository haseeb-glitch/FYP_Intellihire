import json
import os
from flask import current_app

def load_rubric(agent_name):
    """
    Loads the rubric JSON for the specified agent.
    """
    file_path = os.path.join(current_app.config['RUBRICS_DIR'], f"{agent_name}_rubric.json")
        
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading rubric for {agent_name}: {e}")
        return None

def get_grade(score):
    """
    Maps a numeric score (0-10) to a letter grade.
    """
    if score >= 8: return "A"
    if score >= 6: return "B"
    if score >= 4: return "C"
    if score >= 2: return "D"
    return "F"

def apply_rubric(agent_name, raw_scores_dict):
    """
    Calculates weighted score, grade, and label based on agent's rubric.
    """
    rubric = load_rubric(agent_name)
    if not rubric:
        # Fallback if rubric missing
        avg = sum(raw_scores_dict.values()) / len(raw_scores_dict) if raw_scores_dict else 5.0
        return {
            "weighted_score": round(avg, 2),
            "grade": get_grade(avg),
            "percentile_label": "Average"
        }

    weights = rubric.get("weights", {})
    performance_levels = rubric.get("performance_levels", {})
    
    weighted_score = 0.0
    for key, weight in weights.items():
        score = raw_scores_dict.get(key, 5.0) # Default to 5.0 if score missing
        weighted_score += score * weight
        
    weighted_score = round(weighted_score, 2)
    
    # Determine percentile label
    percentile_label = "Average"
    for level, range_info in performance_levels.items():
        if range_info["min"] <= weighted_score <= range_info["max"]:
            percentile_label = range_info["label"]
            break
            
    return {
        "weighted_score": weighted_score,
        "grade": get_grade(weighted_score),
        "percentile_label": percentile_label
    }
