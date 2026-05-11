"""
IntelliHIRE - Video Analysis Module (Post-Recording)
======================================================
Analyzes recorded video files after recording is complete.
Extracts frames and generates comprehensive metrics including:
- Emotion detection and probabilities
- Stress score (0-100)
- Gaze focus analysis
- Posture analysis
- Blink rate and frequency
- Head pose estimation
- Hand-face gesture detection
"""

import os
import cv2
import numpy as np
import json
from typing import Dict, Optional, Tuple
from pathlib import Path

try:
    from backend.agents.video.video_analyzer import VideoAnalyzer
    from backend.config import Config
except ImportError:
    # Fallback for direct script execution
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    from agents.video.video_analyzer import VideoAnalyzer


def _default_analysis(error: Optional[str] = None) -> Dict:
    """
    Returns baseline analysis values when processing fails.
    """
    if error:
        print(f"Video Analysis Error: {error}")
    
    return {
        "session_id": "",
        "duration_sec": 0.0,
        "emotion": "neutral",
        "emotion_probs": {e: 0.0 for e in ["happy", "neutral", "surprise", "sad", "disgust", "angry", "fear"]},
        "stress_score": 50.0,
        "emotion_stress": 50.0,
        "gaze_score": 50.0,
        "posture_score": 50.0,
        "blink_total": 0,
        "blink_bpm": 0.0,
        "head_pose": [0, 0, 0],
        "face_detected": False,
        "geo_cues": [],
        "posture_issues": [],
        "hand_label": None,
        "frames_processed": 0,
        "error": error
    }


def analyze_video_file(video_path: str) -> Dict:
    """
    Analyzes a recorded video file and returns comprehensive metrics.
    
    Args:
        video_path: Path to the video file to analyze
        
    Returns:
        Dictionary containing video analysis metrics
    """
    if not os.path.exists(video_path):
        return _default_analysis(f"Video file not found at: {video_path}")
    
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return _default_analysis("Could not open video file")
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration_sec = total_frames / fps if fps > 0 else 0
        
        # Initialize analyzer
        analyzer = VideoAnalyzer()
        
        frames_processed = 0
        frame_count = 0
        
        # Process every frame (or sample for very long videos)
        # Sample every 2nd frame for videos > 5 minutes to keep processing reasonable
        sample_rate = 2 if duration_sec > 300 else 1
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Sample frames
            if frame_count % sample_rate == 0:
                try:
                    # Process frame with analyzer
                    analyzer.process_frame(frame)
                    frames_processed += 1
                except Exception as e:
                    print(f"Error processing frame {frame_count}: {e}")
                    continue
            
            frame_count += 1
            
            # Limit processing for very long videos (max 1000 frames)
            if frames_processed >= 1000:
                break
        
        cap.release()
        
        # Get session report from analyzer
        report = analyzer.get_session_report()
        analyzer.cleanup()
        
        # Enhance report with additional information
        enhanced_report = {
            "duration_sec": round(duration_sec, 1),
            "frames_processed": frames_processed,
            "total_frames_in_video": total_frames,
            "fps": round(fps, 1),
            **report
        }
        
        return enhanced_report
        
    except Exception as e:
        print(f"Video analysis failed: {e}")
        return _default_analysis(str(e))


def analyze_video_with_transcript(video_path: str, transcript_text: str = "") -> Dict:
    """
    Analyzes video and combines metrics with transcript information.
    
    Args:
        video_path: Path to the video file
        transcript_text: Transcribed text from audio (for reference)
        
    Returns:
        Dictionary with video metrics and transcript reference
    """
    analysis = analyze_video_file(video_path)
    
    if transcript_text:
        analysis["transcript_words"] = len(transcript_text.split()) if transcript_text else 0
        analysis["transcript_length"] = len(transcript_text) if transcript_text else 0
    
    return analysis


# Convenience function for quick analysis
def analyze(video_path: str, **kwargs) -> Dict:
    """
    Quick analysis function compatible with audio module's API.
    
    Args:
        video_path: Path to video file
        **kwargs: Additional arguments (ignored for compatibility)
        
    Returns:
        Analysis metrics dictionary
    """
    return analyze_video_file(video_path)
