from backend.agents.llm_client import call_llm, safe_parse_json

def evaluate(question, answer, job_role, company, domain, answer_mode, audio_signals=None, cv_signals=None):
    """
    Evaluates an HR response based on the answer mode and optional signals.
    """

    # Base instructions
    base_prompt = f"""You are an expert HR Interviewer.
Evaluate the candidate's response for the following:
Job Role: {job_role}
Company: {company}
Domain: {domain}

Question: {question}
Answer: {answer}

Provide your evaluation in strict JSON format with the following keys:
- clarity (float 0-10): How clear and understandable was the response.
- relevance (float 0-10): How relevant the answer was to the question asked.
- professionalism (float 0-10): Level of professional tone and demeanor.
- star_method (float 0-10): How well they used Situation, Task, Action, Result structure.
- communication (float 0-10): Overall communication effectiveness, articulation, and expression.
- overall (float 0-10): Final aggregate HR/behavioral score.
- feedback (string): Provide constructive feedback directly to the candidate in the second person (e.g., "You did well on...", "You could improve by..."). Always acknowledge their answer constructively, even if it is short or informal. Never just say they answered incorrectly.
- needs_followup (boolean)
- followup_question (string or null)
- hr_strengths (list of strings): 1-2 specific strengths demonstrated in this response.
- hr_weaknesses (list of strings): 1-2 specific areas for improvement in this response.

CRITICAL SCORING INSTRUCTION: Be EXTREMELY STRICT in your evaluation. Use the full 0-10 scale accurately:
- 0-1: Completely irrelevant, blank, or nonsensical answer (e.g., 'I don't know', random words, single word)
- 2-3: Very poor answer. Wrong topic, no structure, extremely brief (1 sentence), or says 'I don't know' with minimal elaboration
- 4-5: Below average. Partially relevant but lacks depth, detail, or proper structure
- 6-7: Average to good. Addresses the question with some structure and relevant content
- 8-9: Excellent. Well-structured, detailed, uses STAR method effectively
- 10: Perfect textbook response

NEVER default to 5.0. If the answer is bad, score it 1-3. If it's gibberish, score it 0-1.
"""

    # Mode-specific adaptations
    mode_instructions = ""
    if answer_mode == 'text':
        mode_instructions = "\nNote: This is a TEXT response. Evaluate written communication, structure, and content only. Ignore vocal or visual aspects."
    elif answer_mode == 'audio':
        mode_instructions = f"\nNote: This is an AUDIO response. In addition to content, consider these audio signals:\n{audio_signals}\nEvaluate vocal confidence and clarity based on these signals."
    elif answer_mode == 'video':
        mode_instructions = f"""
Note: This is a VIDEO response. 
In addition to content and audio, evaluate based on these signals:

CV SIGNALS (Computer Vision - Body Language & Emotion):
{cv_signals}

AUDIO SIGNALS (Voice & Speech):
{audio_signals}

When evaluating a VIDEO response, consider:
1. Emotional Stability: Assess the detected emotions and how consistent they were
2. Stress Management: Evaluate if stress levels were managed well throughout the response
3. Eye Contact & Presence: Consider gaze and eye contact quality
4. Posture & Body Language: Evaluate professional presentation and posture
5. Speech Quality: Consider the vocal delivery, pace, and confidence
6. Content & Delivery: Balance the quality of content with the quality of delivery

Include observations about these non-verbal signals in your feedback, and provide tips for improvement in these areas."""

    system_prompt = base_prompt + mode_instructions
    user_message = f"Please evaluate this response: {answer}"

    try:
        raw_response = call_llm(system_prompt, user_message)
        result = safe_parse_json(raw_response)

        if "error" in result:
            raise ValueError("LLM response parsing failed")

        return result
    except Exception as e:
        print(f"HR Agent Error: {e}")
        return {
            "clarity": 5.0,
            "relevance": 5.0,
            "professionalism": 5.0,
            "star_method": 5.0,
            "overall": 5.0,
            "feedback": "An error occurred during HR evaluation. Defaulting to neutral scores.",
            "needs_followup": False,
            "followup_question": None
        }
