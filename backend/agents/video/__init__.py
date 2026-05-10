"""
Video Analysis Agents
=====================
Real-time video analysis for interview candidates.
Includes emotion detection, gaze tracking, posture analysis, and stress scoring.
"""

from backend.agents.video.video_analyzer import (
    VideoAnalyzer,
    get_analyzer,
    clear_analyzer,
    process_video_frame,
    MEDIAPIPE_AVAILABLE,
    DEEPFACE_AVAILABLE
)

from backend.agents.video.emotion_detection import detect_emotions
from backend.agents.video.posture_analysis import analyze_posture
from backend.agents.video.face_tracking import track_face, detect_blink, create_blink_tracker

__all__ = [
    'VideoAnalyzer',
    'get_analyzer',
    'clear_analyzer',
    'process_video_frame',
    'detect_emotions',
    'analyze_posture',
    'track_face',
    'detect_blink',
    'create_blink_tracker',
    'MEDIAPIPE_AVAILABLE',
    'DEEPFACE_AVAILABLE'
]
