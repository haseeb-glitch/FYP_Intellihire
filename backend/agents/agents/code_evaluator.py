"""
Code Evaluator Agent

Evaluates code submissions for technical interview questions.
Uses LLM to analyze code quality, correctness, and efficiency.
"""

from backend.agents.llm_client import call_llm, safe_parse_json


def evaluate_code(question: str, code: str, language: str = "python",
                  expected_approach: str = None, test_cases: list = None):
    """
    Evaluates a code submission using LLM analysis.

    Args:
        question: The coding question asked
        code: The submitted code
        language: Programming language (python, javascript, etc.)
        expected_approach: Hint about expected solution approach
        test_cases: Optional list of test cases [{input, expected_output}]

    Returns:
        dict with correctness, efficiency, code_quality, feedback, overall
    """

    test_case_info = ""
    if test_cases:
        test_case_info = f"\n\nTest Cases to consider:\n{test_cases}"

    approach_hint = ""
    if expected_approach:
        approach_hint = f"\nExpected approach hints: {expected_approach}"

    system_prompt = f"""You are an expert code reviewer and technical interviewer.
Evaluate the following code submission for a technical interview question.

Language: {language}
{approach_hint}
{test_case_info}

Evaluate the code on these criteria:
1. **Correctness** (0-10): Does the code solve the problem correctly? Does it handle edge cases?
2. **Efficiency** (0-10): What is the time and space complexity? Is it optimal?
3. **Code Quality** (0-10): Is it clean, readable, well-structured? Good variable names?
4. **Best Practices** (0-10): Does it follow language conventions and best practices?

Provide your evaluation in strict JSON format:
{{
    "correctness": float 0-10,
    "efficiency": float 0-10,
    "code_quality": float 0-10,
    "best_practices": float 0-10,
    "overall": float 0-10,
    "time_complexity": "O(n)", // or appropriate
    "space_complexity": "O(1)", // or appropriate
    "bugs_found": ["list of bugs or issues"],
    "improvements": ["suggestions for improvement"],
    "feedback": "Constructive feedback for the candidate. Address what they did well and what could be improved. Be specific about the code."
}}

CRITICAL: Be strict but fair. If the code is completely wrong or doesn't compile, score it 0-2.
If it's partially correct, score 3-5. Good solutions get 6-8. Excellent gets 9-10.
"""

    user_message = f"""Question: {question}

Submitted Code:
```{language}
{code}
```

Please evaluate this code submission."""

    try:
        raw_response = call_llm(system_prompt, user_message)
        result = safe_parse_json(raw_response)

        if "error" in result:
            raise ValueError("LLM response parsing failed")

        # Ensure all required keys exist
        defaults = {
            "correctness": 5.0,
            "efficiency": 5.0,
            "code_quality": 5.0,
            "best_practices": 5.0,
            "overall": 5.0,
            "time_complexity": "Unknown",
            "space_complexity": "Unknown",
            "bugs_found": [],
            "improvements": [],
            "feedback": "Code evaluation completed."
        }

        for key, default_val in defaults.items():
            if key not in result:
                result[key] = default_val

        return result

    except Exception as e:
        print(f"Code Evaluator Error: {e}")
        return {
            "correctness": 0.0,
            "efficiency": 5.0,
            "code_quality": 5.0,
            "best_practices": 5.0,
            "overall": 3.0,
            "time_complexity": "Unable to analyze",
            "space_complexity": "Unable to analyze",
            "bugs_found": ["Evaluation error occurred"],
            "improvements": ["Please review the code manually"],
            "feedback": "An error occurred during code evaluation. The code may have syntax issues or the evaluator encountered a problem."
        }


def get_starter_code(language: str, question_type: str = "function") -> str:
    """
    Returns starter code template for a given language.
    """
    templates = {
        "python": {
            "function": '''def solution(input_data):
    """
    Your solution here.

    Args:
        input_data: The input to process

    Returns:
        The result
    """
    # Write your code here
    pass
''',
            "class": '''class Solution:
    def __init__(self):
        pass

    def solve(self, input_data):
        """Your solution here."""
        pass
'''
        },
        "javascript": {
            "function": '''function solution(inputData) {
    // Your solution here

    return result;
}
''',
            "class": '''class Solution {
    constructor() {
        // Initialize if needed
    }

    solve(inputData) {
        // Your solution here
        return result;
    }
}
'''
        },
        "java": {
            "function": '''public class Solution {
    public static Object solve(Object inputData) {
        // Your solution here
        return null;
    }
}
''',
        }
    }

    lang_templates = templates.get(language, templates["python"])
    return lang_templates.get(question_type, lang_templates.get("function", ""))
