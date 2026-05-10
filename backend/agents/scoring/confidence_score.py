import re

def compute_confidence(answer_mode, audio_signals=None, cv_signals=None, text_answer=""):
    """
    Computes a multi-modal confidence score based on linguistics, vocals, and visuals.
    """
    
    # Defaults
    text_conf = 5.0
    vocal_conf = 5.0
    visual_conf = 5.0

    # 1. Text Analysis
    if text_answer:
        certainty_markers = ["definitely", "clearly", "certain", "absolutely", "surely", "undoubtedly", "know", "confident"]
        hedging_words = ["maybe", "think", "possibly", "not sure", "perhaps", "actually", "kind", "sort", "guess", "might"]
        
        text_lower = text_answer.lower()
        c_count = sum(1 for w in certainty_markers if w in text_lower)
        h_count = sum(1 for w in hedging_words if w in text_lower)
        
        # Heuristic: start at 5, +1 per certainty, -1 per hedging
        text_conf = 5.0 + (c_count * 1.0) - (h_count * 1.0)
        text_conf = max(0, min(10, text_conf))

    # 2. Audio Analysis
    if audio_signals:
        # High confidence = low pause ratio (0-1) and moderate/high speech rate (0-10)
        pause_ratio = audio_signals.get("pause_ratio", 0.5)
        speech_rate = audio_signals.get("speech_rate", 2.0)
        
        # Normalized pause: 1.0 - pause_ratio
        pause_score = (1.0 - pause_ratio) * 10
        # Optimal rate: 3-5 onsets/sec is high confidence. Let's normalize around 4.
        rate_score = max(0, 10 - abs(speech_rate - 4.0) * 2)
        
        vocal_conf = (pause_score * 0.6) + (rate_score * 0.4)
        vocal_conf = max(0, min(10, vocal_conf))

    # 3. Video Analysis
    if cv_signals:
        # Confidence derived from eye contact and stability
        eye_contact = cv_signals.get("eye_contact_score", 5.0)
        stability = cv_signals.get("head_stability", 0.5) * 10
        
        visual_conf = (eye_contact * 0.7) + (stability * 0.3)
        visual_conf = max(0, min(10, visual_conf))

    # Aggregate Overall Confidence
    if answer_mode == 'text':
        overall_confidence = text_conf
    elif answer_mode == 'audio':
        overall_confidence = (text_conf * 0.4) + (vocal_conf * 0.6)
    elif answer_mode == 'video':
        overall_confidence = (text_conf * 0.3) + (vocal_conf * 0.3) + (visual_conf * 0.4)
    else:
        overall_confidence = 5.0

    return {
        "text_confidence": round(text_conf, 2),
        "vocal_confidence": round(vocal_conf, 2),
        "visual_confidence": round(visual_conf, 2),
        "overall_confidence": round(overall_confidence, 2)
    }
