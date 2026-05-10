from backend.utils.constants import SUPPORTED_DOMAINS, DIFFICULTY_LEVELS, ANSWER_MODES

def validate_setup(data):
    """
    Validates the setup data for a new interview session.
    """
    errors = []
    
    domain = data.get('domain')
    if not domain or domain not in SUPPORTED_DOMAINS:
        errors.append(f"Invalid or missing domain. Supported: {SUPPORTED_DOMAINS}")
        
    difficulty = data.get('difficulty')
    if not difficulty or difficulty not in DIFFICULTY_LEVELS:
        errors.append(f"Invalid or missing difficulty. Supported: {DIFFICULTY_LEVELS}")
        
    answer_mode = data.get('answer_mode')
    if not answer_mode or answer_mode not in ANSWER_MODES:
        errors.append(f"Invalid or missing answer_mode. Supported: {ANSWER_MODES}")
        
    if not data.get('job_role'):
        errors.append("Missing job_role")
        
    # Company name is only required for company-targeted interviews
    interview_type = data.get('interview_type', 'domain')
    if interview_type == 'company' and not data.get('company_name'):
        errors.append("Missing company_name for company-targeted interview")
        
    return errors

def build_question_response(sq, session):
    """
    Formats a SessionQuestion model for an API response.
    Uses the question's adaptive difficulty, not the session's initial difficulty.
    Includes coding info for code questions in text mode only.
    """
    response = {
        "id": str(sq.id),
        "text": sq.question_text,
        "type": sq.question_type,
        "subtype": sq.question_subtype,
        "requires_code": sq.requires_code and session.answer_mode == 'text',
        "order": sq.order_number,
        "total": session.total_questions,
        "difficulty": sq.difficulty or session.difficulty,
        "time_limit_seconds": 300 if sq.requires_code else 120
    }

    # Add coding-specific fields only for text mode
    if sq.requires_code and session.answer_mode == 'text':
        response["language"] = sq.code_language or "python"
        response["starter_code"] = _get_starter_code(sq.code_language or "python", sq.question_text)

    return response


def _get_starter_code(language: str, question: str) -> str:
    """Returns a basic starter code template."""
    templates = {
        "python": '''def solution(data):
    """
    Write your solution here.
    """
    # Your code here
    pass

# Test your solution
# print(solution(your_test_input))
''',
        "javascript": '''function solution(data) {
    // Write your solution here

    return result;
}

// Test your solution
// console.log(solution(yourTestInput));
''',
        "java": '''public class Solution {
    public static void main(String[] args) {
        // Test your solution here
    }

    public static Object solution(Object data) {
        // Write your solution here
        return null;
    }
}
'''
    }
    return templates.get(language, templates["python"])