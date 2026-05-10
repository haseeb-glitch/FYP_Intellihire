"""
Face Tracking Module
====================
Provides face detection, gaze tracking, and blink detection using MediaPipe.
"""

from backend.agents.video.video_analyzer import (
    get_gaze_score, get_head_pose, calc_ear, face_bbox_from_mesh,
    BlinkTracker, L_EAR_PTS, R_EAR_PTS, MEDIAPIPE_AVAILABLE
)


def track_face(landmarks, fw=640, fh=480):
    """
    Track face and extract metrics from landmarks.

    Args:
        landmarks: MediaPipe face mesh landmarks
        fw: Frame width
        fh: Frame height

    Returns:
        Dict with face tracking metrics
    """
    if landmarks is None:
        return {
            "face_detected": False,
            "gaze_score": 0.0,
            "head_pose": (0.0, 0.0, 0.0),
            "bbox": None
        }

    bbox = face_bbox_from_mesh(landmarks, fw, fh)
    gaze = get_gaze_score(landmarks, fw, fh)
    pose = get_head_pose(landmarks, fw, fh)

    return {
        "face_detected": True,
        "gaze_score": gaze,
        "head_pose": pose,
        "bbox": bbox
    }


def detect_blink(landmarks, blink_tracker, fw=640, fh=480):
    """
    Detect blinks from face landmarks.

    Args:
        landmarks: MediaPipe face mesh landmarks
        blink_tracker: BlinkTracker instance
        fw: Frame width
        fh: Frame height

    Returns:
        Dict with blink metrics
    """
    if landmarks is None:
        return {
            "total_blinks": blink_tracker.total_blinks,
            "blinks_per_minute": blink_tracker.blinks_per_minute(),
            "blink_stress": blink_tracker.stress_contribution()
        }

    l_ear = calc_ear(landmarks, L_EAR_PTS, fw, fh)
    r_ear = calc_ear(landmarks, R_EAR_PTS, fw, fh)
    avg_ear = (l_ear + r_ear) / 2.0

    blink_tracker.update(avg_ear)

    return {
        "total_blinks": blink_tracker.total_blinks,
        "blinks_per_minute": blink_tracker.blinks_per_minute(),
        "blink_stress": blink_tracker.stress_contribution(),
        "current_ear": avg_ear
    }


def create_blink_tracker():
    """Create a new BlinkTracker instance."""
    return BlinkTracker()
