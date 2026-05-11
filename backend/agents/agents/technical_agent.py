from backend.agents.llm_client import call_llm, safe_parse_json
from backend.agents.agents import code_evaluator


def evaluate(question, answer, domain, job_role, answer_mode, question_subtype="conceptual", code_submitted=None, code_output=None, code_language=None, audio_signals=None, cv_signals=None):
    """
    Evaluates a technical response, considering code quality, conceptual depth, and signals.
    For coding questions, uses the dedicated code evaluator.
    """

    # If code was submitted, use the code evaluator for detailed code analysis
    code_evaluation = None
    if code_submitted and question_subtype == "coding":
        print(f"  Evaluating code submission in {code_language or 'python'}...")
        code_evaluation = code_evaluator.evaluate_code(
            question=question,
            code=code_submitted,
            language=code_language or "python"
        )

    # Base instructions
    base_prompt = f"""You are a Senior Technical Interviewer and Software Architect.
Evaluate the candidate's technical response for:
Domain: {domain}
Job Role: {job_role}
Question Type: {question_subtype}

Question: {question}
Answer/Transcript: {answer}
"""

    # Add code context if applicable
    code_context = ""
    if code_submitted:
        code_context = f"\nSubmitted Code:\n```{code_language or 'python'}\n{code_submitted}\n```"
        if code_evaluation:
            code_context += f"\n\nCode Analysis Results:\n- Correctness: {code_evaluation.get('correctness', 'N/A')}/10"
            code_context += f"\n- Efficiency: {code_evaluation.get('efficiency', 'N/A')}/10 (Time: {code_evaluation.get('time_complexity', 'N/A')}, Space: {code_evaluation.get('space_complexity', 'N/A')})"
            code_context += f"\n- Code Quality: {code_evaluation.get('code_quality', 'N/A')}/10"
            if code_evaluation.get('bugs_found'):
                code_context += f"\n- Issues Found: {', '.join(code_evaluation.get('bugs_found', []))}"

    # Final prompt building
    system_prompt = base_prompt + code_context + """
Provide your evaluation in strict JSON format with the following keys:
- correctness (float 0-10): Accuracy of the technical concepts or code logic.
- depth (float 0-10): Level of detail and understanding shown.
- efficiency (float 0-10): Optimization, Big O, or resource management (if applicable).
- communication (float 0-10): Clarity of technical explanation.
- problem_solving (float 0-10): Approach to breaking down and solving the problem.
- overall (float 0-10): Final aggregate technical score.
- feedback (string): Provide constructive feedback directly to the candidate in the second person (e.g., "You did well on...", "You could improve by..."). Always acknowledge their answer constructively, even if it is short or informal. Never just say they answered incorrectly.
- needs_followup (boolean)
- followup_question (string or null)

CRITICAL SCORING INSTRUCTION: Be EXTREMELY STRICT and precise in your scoring. Use the full 0-10 scale accurately:
- 0-1: Completely wrong, irrelevant, blank, or nonsensical (e.g., 'I don't know', random text, completely off-topic)
- 2-3: Very poor. Major technical errors, wrong concepts, extremely brief with no substance
- 4-5: Below average. Some relevant keywords but fundamental misunderstandings or very shallow
- 6-7: Average to good. Correct core concepts but missing important details or optimizations
- 8-9: Excellent. Deep understanding, correct implementation, considers edge cases
- 10: Perfect textbook answer with optimal solution

NEVER default to 5.0. If the candidate gives wrong answers or says 'I don't know', score them 0-3.
- next_difficulty (string): Recommendation for the next question difficulty (easy/medium/hard).
- key_missing_concepts (list of strings): Concepts the candidate failed to mention or implement.
"""

    # Add video mode insights if applicable
    if answer_mode == 'video':
        system_prompt += f"""

IMPORTANT: This is a VIDEO response. Additionally, consider these non-verbal signals in your feedback:

CV SIGNALS (Computer Vision - Body Language & Emotion):
{cv_signals}

AUDIO SIGNALS (Voice & Speech Analysis):
{audio_signals}

When evaluating this video response, also comment on:
1. Technical Confidence: How confident was the candidate in their technical explanation (based on vocal and visual signals)?
2. Problem-Solving Approach: Did their body language and tone suggest systematic thinking or confusion?
3. Communication Clarity: Was the technical explanation delivered clearly and at appropriate pace?
4. Composure Under Pressure: Did they maintain composure when discussing complex topics?

In your feedback, briefly mention any observations about their delivery and presence alongside the technical evaluation."""

    user_message = f"Please evaluate this technical response: {answer}"

    try:
        raw_response = call_llm(system_prompt, user_message)
        result = safe_parse_json(raw_response)

        if "error" in result:
            raise ValueError("LLM response parsing failed")

        # Merge code evaluation results if available
        if code_evaluation:
            result["code_evaluation"] = code_evaluation
            # Adjust scores based on code evaluation for coding questions
            if question_subtype == "coding":
                code_overall = code_evaluation.get("overall", 5.0)
                result["correctness"] = (result.get("correctness", 5.0) + code_evaluation.get("correctness", 5.0)) / 2
                result["efficiency"] = code_evaluation.get("efficiency", result.get("efficiency", 5.0))
                result["overall"] = (result.get("overall", 5.0) + code_overall) / 2

        # Ensure efficiency is always present and valid (0-10)
        eff = result.get("efficiency", None)
        try:
            eff = float(eff)
            if not (0 <= eff <= 10):
                eff = 5.0
        except Exception:
            eff = 5.0
        result["efficiency"] = eff

        return result
    except Exception as e:
        print(f"Technical Agent Error: {e}")
        return {
            "correctness": 5.0,
            "depth": 5.0,
            "efficiency": 5.0,
            "communication": 5.0,
            "problem_solving": 5.0,
            "overall": 5.0,
            "feedback": "An error occurred during technical evaluation. Please review manually.",
            "next_difficulty": "medium",
            "key_missing_concepts": [],
            "code_evaluation": code_evaluation
        }