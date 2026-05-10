"""
Video Session Management Service
Handles video recording, analysis, and transcription for interview sessions.
"""

import os
import time
import json
import base64
import threading
import cv2
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional

from backend.config import Config
from backend.agents.video.video_analyzer import VideoAnalyzer
from backend.agents.audio import transcription


class VideoSession:
    """Manages a single video recording session."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.lock = threading.Lock()
        self.is_recording = False
        self.start_time = None

        self.last_frame_b64 = None
        self.last_stats = {}

        self.analyzer = VideoAnalyzer()
        self.frames = []
        self.audio_chunks = []

        self._setup_paths()

    def _setup_paths(self):
        """Set up file paths for video and audio storage."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_dir = Path(Config.UPLOAD_FOLDER) / "sessions" / self.session_id
        base_dir.mkdir(parents=True, exist_ok=True)

        self.video_path = base_dir / f"video_{timestamp}.mp4"
        self.audio_path = base_dir / f"audio_{timestamp}.wav"
        self.report_path = base_dir / f"report_{timestamp}.json"

    def start(self):
        """Start recording session."""
        with self.lock:
            self.is_recording = True
            self.start_time = time.time()
            self.frames = []
            self.audio_chunks = []

    def process_frame(self, frame_data: bytes) -> Dict:
        """Process a single video frame."""
        if not self.is_recording:
            return {}

        try:
            nparr = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                return {}

            with self.lock:
                self.frames.append(frame)
                metrics = self.analyzer.process_frame(frame)
                self.last_stats = metrics

                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                self.last_frame_b64 = base64.b64encode(buffer).decode('utf-8')

            return metrics
        except Exception as e:
            print(f"Frame processing error: {e}")
            return {}

    def add_audio_chunk(self, audio_data: bytes):
        """Add audio chunk to the recording."""
        if self.is_recording:
            with self.lock:
                self.audio_chunks.append(audio_data)

    def stop(self) -> Dict:
        """Stop recording and generate report."""
        with self.lock:
            self.is_recording = False
            duration = time.time() - self.start_time if self.start_time else 0

        self._save_video()
        self._save_audio()

        video_report = self.analyzer.get_session_report()

        transcript_result = {"text": "", "error": None}
        if self.audio_path.exists():
            transcript_result = transcription.transcribe(str(self.audio_path))

        transcript_file = None
        if transcript_result.get("text"):
            transcript_file = self._save_transcript_file(transcript_result["text"])

        report = {
            "session_id": self.session_id,
            "duration_sec": round(duration, 1),
            "video_path": str(self.video_path.relative_to(Path(Config.UPLOAD_FOLDER).parent)),
            "audio_path": str(self.audio_path.relative_to(Path(Config.UPLOAD_FOLDER).parent)),
            "report_path": str(self.report_path.relative_to(Path(Config.UPLOAD_FOLDER).parent)),
            "transcript_text": transcript_result.get("text", ""),
            "transcript_file": transcript_file,
            "transcript_error": transcript_result.get("error"),
            **video_report
        }

        self._save_report(report)
        self.analyzer.cleanup()

        return report

    def _save_video(self):
        """Save recorded frames to video file."""
        if not self.frames:
            return

        try:
            h, w = self.frames[0].shape[:2]
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            fps = len(self.frames) / max((time.time() - self.start_time), 1)
            fps = max(10, min(30, fps))

            writer = cv2.VideoWriter(str(self.video_path), fourcc, fps, (w, h))
            for frame in self.frames:
                writer.write(frame)
            writer.release()
        except Exception as e:
            print(f"Video save error: {e}")

    def _save_audio(self):
        """Save recorded audio chunks to WAV file."""
        if not self.audio_chunks:
            return

        try:
            import wave
            with wave.open(str(self.audio_path), 'wb') as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(16000)
                wf.writeframes(b''.join(self.audio_chunks))
        except Exception as e:
            print(f"Audio save error: {e}")

    def _save_transcript_file(self, transcript_text: str) -> Optional[str]:
        """Save transcript text to a text file and return its relative path."""
        if not transcript_text:
            return None

        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            transcript_path = self.video_path.parent / f"transcript_{timestamp}.txt"
            with open(transcript_path, "w", encoding="utf-8") as f:
                f.write(transcript_text)
            return str(transcript_path.relative_to(Path(Config.UPLOAD_FOLDER).parent))
        except Exception as e:
            print(f"Transcript file save error: {e}")
            return None

    def _save_report(self, report: Dict):
        """Save session report to JSON file."""
        try:
            with open(self.report_path, 'w') as f:
                json.dump(report, f, indent=2, default=str)
        except Exception as e:
            print(f"Report save error: {e}")


class VideoSessionManager:
    """Manages multiple video recording sessions."""

    def __init__(self):
        self._sessions: Dict[str, VideoSession] = {}
        self._lock = threading.Lock()

    def create_session(self, session_id: str) -> VideoSession:
        """Create and start a new video session."""
        with self._lock:
            if session_id in self._sessions:
                self._sessions[session_id].stop()

            session = VideoSession(session_id)
            session.start()
            self._sessions[session_id] = session
            return session

    def get_session(self, session_id: str) -> Optional[VideoSession]:
        """Get an existing video session."""
        with self._lock:
            return self._sessions.get(session_id)

    def is_active(self, session_id: str) -> bool:
        """Check if a session is currently recording."""
        with self._lock:
            session = self._sessions.get(session_id)
            return session is not None and session.is_recording

    def stop_session(self, session_id: str) -> Dict:
        """Stop a session and return its report."""
        with self._lock:
            session = self._sessions.get(session_id)
            if not session:
                return {"error": "Session not found"}

            report = session.stop()
            del self._sessions[session_id]
            return report

    def cleanup_all(self):
        """Stop and cleanup all sessions."""
        with self._lock:
            for session_id in list(self._sessions.keys()):
                try:
                    self._sessions[session_id].stop()
                except Exception:
                    pass
            self._sessions.clear()


video_session_manager = VideoSessionManager()
