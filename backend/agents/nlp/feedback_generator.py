from backend.agents.llm_client import call_llm

def generate_session_summary(all_question_feedbacks, domain, job_role):
    """
    Generates a concise, human-readable summary of the entire interview session.
    """
    if not all_question_feedbacks:
        return "The interview session was concluded without specific feedback."

    feedbacks_blob = "\n- ".join(all_question_feedbacks)
    
    system_prompt = f"""You are a Career Coach and Recruitment Specialist.
Synthesize the following list of per-question feedback strings from a {job_role} interview in the {domain} domain into a single, cohesive session summary.

Feedback Points:
- {feedbacks_blob}

The summary MUST be 3-4 professional, encouraging, yet honest sentences. 
Highlight the core strengths and the primary area for improvement.
"""
    
    try:
        summary = call_llm(system_prompt, "Generate the session summary.")
        return summary.strip()
    except Exception as e:
        print(f"Summary Generation Error: {e}")
        return "The candidate demonstrated solid technical knowledge but could improve on structuring their behavioral responses using the STAR method."

def format_roadmap(roadmap_dict):
    """
    Formats the career/technical roadmap dictionary into a clean, readable string.
    """
    if not roadmap_dict:
        return "No specific roadmap generated."
        
    lines = ["### Professional Development Roadmap\n"]
    
    for category, items in roadmap_dict.items():
        formatted_cat = category.replace('_', ' ').title()
        lines.append(f"**{formatted_cat}**:")
        if isinstance(items, list):
            for item in items:
                lines.append(f"- {item}")
        else:
            lines.append(f"- {items}")
        lines.append("") # Spacer
        
    return "\n".join(lines)
