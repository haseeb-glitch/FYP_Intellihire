"""
Emotion Detection Module
========================
Provides emotion detection using DeepFace + geometry cues.
"""

from backend.agents.video.video_analyzer import (
    EmotionDetector, DEEPFACE_AVAILABLE, ALL_EMOTIONS, EMOTION_STRESS_MAP
)


def detect_emotions(frame=None, face_bbox=None, face_landmarks=None):
    """
    Detect emotions from a video frame.

    Args:
        frame: OpenCV frame (BGR)
        face_bbox: Face bounding box (x, y, w, h)
        face_landmarks: MediaPipe face mesh landmarks

    Returns:
        Dict with emotion probabilities and dominant emotion
    """
    if frame is None:
        return {
            "dominant_emotion": "neutral",
            "emotion_probs": {e: 1.0 / len(ALL_EMOTIONS) for e in ALL_EMOTIONS},
            "emotion_stress": 0.0
        }

    detector = EmotionDetector()
    probs, dominant = detector.update(frame, face_bbox, face_landmarks)
    stress = detector.stress_contribution(probs)

    return {
        "dominant_emotion": dominant,
        "emotion_probs": probs,
        "emotion_stress": stress
    }


def get_emotion_stress_map():
    """Returns the mapping of emotions to stress levels."""
    return EMOTION_STRESS_MAP.copy()
