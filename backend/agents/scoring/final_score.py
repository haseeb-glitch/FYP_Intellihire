def get_letter_grade(score_percent):
    """
    Maps a 0-100 percentage score to a letter grade.
    """
    if score_percent >= 85: return "A"
    if score_percent >= 70: return "B"
    if score_percent >= 55: return "C"
    if score_percent >= 40: return "D"
    return "F"


def compute_single_agent_score(agent_type, agent_score, answer_mode):
    """
    Computes final score when only one agent type was used.
    The single agent score (0-10) becomes the full score (0-100).
    """
    final_percent = round(agent_score * 10, 2)

    return {
        "final_score": final_percent,
        "breakdown": {
            agent_type: final_percent
        },
        "grade": get_letter_grade(final_percent),
        "mode_note": f"Single-agent ({agent_type.upper()}) evaluation in {answer_mode.upper()} mode."
    }

def compute_final_score(hr_overall, technical_overall, stress_overall, company_fit, answer_mode):
    """
    Computes the final weighted percentage score for the entire interview session.
    Weights: Technical 40%, HR 30%, Stress 15%, Company 15%.
    """
    
    # Weights (normalized to 1.0)
    w_tech = 0.40
    w_hr = 0.30
    w_stress = 0.15
    w_fit = 0.15
    
    # All inputs are 0-10
    raw_final = (
        (hr_overall * w_hr) + 
        (technical_overall * w_tech) + 
        (stress_overall * w_stress) + 
        (company_fit * w_fit)
    )
    
    final_percent = round(raw_final * 10, 2)
    
    return {
        "final_score": final_percent,
        "breakdown": {
            "hr": round(hr_overall * 10, 2),
            "technical": round(technical_overall * 10, 2),
            "stress": round(stress_overall * 10, 2),
            "company_fit": round(company_fit * 10, 2)
        },
        "grade": get_letter_grade(final_percent),
        "mode_note": f"Evaluation performed in {answer_mode.upper()} mode."
    }

def aggregate_question_scores(session_questions_list):
    """
    Aggregates scores from all questions in a session.
    Reads from dedicated score fields first, then falls back to question_scores dict.
    """
    if not session_questions_list:
        print("SCORE AGGREGATION: No questions found, returning defaults.")
        return {"hr": 5.0, "technical": 5.0, "stress": 5.0}

    totals = {"hr": 0.0, "technical": 0.0, "stress": 0.0}
    counts = {"hr": 0, "technical": 0, "stress": 0}

    for q in session_questions_list:
        # Compatibility handling for both objects and dicts
        def get_val(obj, attr):
            if hasattr(obj, attr): return getattr(obj, attr)
            if isinstance(obj, dict): return obj.get(attr)
            return None

        q_type = get_val(q, 'question_type')
        
        # Try dedicated score fields first
        hr = get_val(q, 'hr_score')
        tech = get_val(q, 'technical_score')
        stress = get_val(q, 'stress_score')
        
        # Fallback: read 'overall' from the question_scores dict
        scores_dict = get_val(q, 'question_scores')
        if scores_dict and isinstance(scores_dict, dict):
            overall_from_dict = scores_dict.get('overall')
            if overall_from_dict is not None:
                if q_type == 'hr' and hr is None:
                    hr = float(overall_from_dict)
                elif q_type == 'technical' and tech is None:
                    tech = float(overall_from_dict)
                elif q_type == 'stress' and stress is None:
                    stress = float(overall_from_dict)

        print(f"  AGGREGATE Q#{get_val(q, 'order_number')}: type={q_type}, hr={hr}, tech={tech}, stress={stress}")

        if hr is not None:
            totals["hr"] += float(hr)
            counts["hr"] += 1
        if tech is not None:
            totals["technical"] += float(tech)
            counts["technical"] += 1
        if stress is not None:
            totals["stress"] += float(stress)
            counts["stress"] += 1

    averages = {}
    for agent in totals:
        averages[agent] = round(totals[agent] / counts[agent], 2) if counts[agent] > 0 else 5.0

    print(f"  AGGREGATE RESULT: {averages} (counts: {counts})")
    return averages

