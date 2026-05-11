from backend.agents.llm_client import call_llm, safe_parse_json

# Mode-specific strictly defined prompts
PROMPTS = {
    'text': """You are a Stress Analysis Specialist evaluating a TEXT interview answer.
Analyze only written markers of stress: hedging (e.g., 'maybe', 'I think'), filler words, directness vs evasion, and circular reasoning.
Do NOT mention anything about voice, tone, eye contact, or body language.
Focus on verbal confidence and linguistic patterns.
""",
    'audio': """You are a Stress Analysis Specialist evaluating an AUDIO interview answer.
Analyze the transcript for linguistic stress markers AND analyze the following audio signals:
{audio_signals}
Look for vocal steadiness, speech rate variance, and pause ratios. 
Linguistic hedging and tone must be considered together.
""",
    'video': """You are a Stress Analysis Specialist evaluating a VIDEO interview answer.
Analyze stress through MULTIPLE dimensions:

1. VISUAL/BODY LANGUAGE (CV Signals):
{cv_signals}

2. VOCAL/SPEECH (Audio Signals):
{audio_signals}

3. LINGUISTIC (Transcript Analysis):
- Look for hedging words, filler usage, circular reasoning
- Assess how logically structured the response is
- Evaluate directness vs evasion in communication

HOLISTIC EVALUATION:
Consider all three dimensions together. A candidate who speaks confidently but has poor posture shows moderate stress.
One with excellent eye contact and confident voice but evasive language shows suppressed stress.
Integrate all signals for a comprehensive stress assessment.
"""
}

def evaluate(question, answer, answer_mode, audio_signals=None, cv_signals=None):
    """
    Evaluates stress levels based on the specific modality available.
    """
    
    # Select and format the system prompt
    base_instructions = PROMPTS.get(answer_mode, PROMPTS['text'])
    system_prompt = base_instructions.format(audio_signals=audio_signals, cv_signals=cv_signals)
    
    system_prompt += """
Provide your evaluation in strict JSON format with the following keys:
- composure (float 0-10): How well they maintained their cool under the specific query.
- confidence (float 0-10): Level of certainty shown in the modality provided.
- stress_management (float 0-10): Evidence of effective coping mechanisms.
- eye_contact (float 0-10): Score 5.0 for text/audio, reflect CV signals if video.
- vocal_steadiness (float 0-10): Score 5.0 for text, reflect audio signals if audio/video.
- composure (float 0-10)
- confidence (float 0-10)
- stress_management (float 0-10)
- overall (float 0-10): Final aggregate stress-tolerance score.
- feedback (string): Provide constructive feedback directly to the candidate in the second person (e.g., "You did well on...", "You could improve by..."). Always acknowledge their answer constructively, even if it is short or informal. Never just say they answered incorrectly.

CRITICAL SCORING INSTRUCTION: Be EXTREMELY STRICT in your scoring. Use the full 0-10 scale accurately:
- 0-1: Extreme stress indicators: barely coherent, panic, complete avoidance, 'I don't know'
- 2-3: High stress: excessive filler words, evasive, very brief, circular reasoning, obvious discomfort
- 4-5: Moderate stress: some hedging, occasional fillers, slightly unfocused
- 6-7: Relatively composed: minor hesitations but generally clear and direct
- 8-9: Very composed: confident, direct, minimal stress indicators
- 10: Perfectly calm and collected under pressure

NEVER default to 5.0. If the candidate shows clear stress markers or gives very poor answers, score them 1-4.

Additional metrics to include:
- filler_word_score (float 0-10): How well they avoided filler words (higher = fewer fillers). 10 = no fillers, 0 = constant fillers.
- response_coherence (float 0-10): How logically structured and coherent the response was.
- pressure_handling (float 0-10): How well they maintained quality under the pressure of the question.
- stress_indicators (list of strings): Specific red flags (e.g., 'excessive blinking', 'vocal tremors', 'filler word overuse').
- filler_words_detected (list of strings): Actual filler words found in the response (e.g., 'um', 'uh', 'like', 'you know').
"""

    user_message = f"Analyze the stress levels in this response:\nQuestion: {question}\nAnswer/Transcript: {answer}"

    try:
        raw_response = call_llm(system_prompt, user_message)
        result = safe_parse_json(raw_response)
        
        if "error" in result:
            raise ValueError("LLM response parsing failed")
            
        return result
    except Exception as e:
        print(f"Stress Agent Error: {e}")
        return {
            "composure": 5.0,
            "confidence": 5.0,
            "stress_management": 5.0,
            "eye_contact": 5.0,
            "vocal_steadiness": 5.0,
            "overall": 5.0,
            "feedback": "An error occurred during stress evaluation. Defaulting to baseline.",
            "stress_indicators": ["Agent Error"]
        }