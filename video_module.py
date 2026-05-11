"""
IntelliHIRE - Video Analysis Module (v3)
=========================================
New in v3:
  - Hand-near-face detection: hand on lips → stress boost +40, hand on forehead → stress boost +70
  - Lip geometry: wide lip line = happy/smile override, compressed lips = fear/sad boost
  - Forehead geometry: vertical wrinkle lines (brow compression) = angry boost
  - All geometry cues blend INTO DeepFace probabilities, not replace them
  - Geometry override badge shows on HUD when a cue is active

Requirements:
    pip install opencv-python mediapipe deepface tensorflow numpy requests sounddevice soundfile

Run:
    python video_module.py
"""

import cv2
import numpy as np
import os
import time
import json
import threading
from collections import deque

from mediapipe.python import solutions as mp_solutions
import requests
import sounddevice as sd
import soundfile as sf
from deepface import DeepFace


# ─────────────────────────────────────────────────────────────────
#  CONFIG
# ─────────────────────────────────────────────────────────────────

WINDOW_NAME      = "IntelliHIRE - Video Module"

STRESS_WEIGHTS = {
    "emotion":  0.35,
    "gaze":     0.25,
    "posture":  0.20,
    "blink":    0.20,
}

BLINK_WINDOW_SEC    = 30
BLINK_NORMAL_BPM    = 15.0
BLINK_STRESS_BPM    = 30.0
STRESS_EMA_ALPHA    = 0.08
EMOTION_INTERVAL    = 10        # Run more frequently for better tracking
FACE_CROP_PAD       = 60        # Increased from 30 to give DeepFace more context
EMOTION_SMOOTH_FRAMES = 12      # Increased from 8 for more temporal smoothing

RECORDING_PREFIX   = "intellihire"
VIDEO_OUTPUT_FILE   = f"{RECORDING_PREFIX}_recording.mp4"
AUDIO_OUTPUT_FILE   = f"{RECORDING_PREFIX}_audio.wav"
AUDIO_SAMPLE_RATE   = 16000
AUDIO_CHANNELS      = 1
ASSEMBLYAI_API_KEY_ENV = "ASSEMBLYAI_API_KEY"
ASSEMBLYAI_UPLOAD_URL  = "https://api.assemblyai.com/v2/upload"
ASSEMBLYAI_TRANSCRIPT_URL = "https://api.assemblyai.com/v2/transcript"
TRANSCRIPT_POLL_INTERVAL = 3
FILLER_WORDS = [
    "um", "umm", "uh", "uhh", "er", "erm", "ah", "aah", "aaah",
    "hmm", "mhm", "mm", "like", "you know", "i mean",
]


def load_dotenv(dotenv_path=None):
    """Load environment variables from a .env file if present."""
    if dotenv_path is None:
        base_dir = os.path.dirname(__file__)
        candidates = [
            os.path.join(base_dir, ".env"),
            os.path.join(base_dir, "FYP Intellihire", ".env"),
            os.path.join(os.getcwd(), ".env"),
        ]
    else:
        candidates = [dotenv_path]

    dotenv_path = next((path for path in candidates if os.path.exists(path)), None)
    if dotenv_path is None:
        return

    with open(dotenv_path, "r", encoding="utf-8") as env_file:
        for line in env_file:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value

load_dotenv()

# ── Geometry cue thresholds ───────────────────────────────────────

# Lip ratio: lip_width / face_width
# Above SMILE_THRESH → happy override
# Below COMPRESS_THRESH → fear/sad override
SMILE_THRESH    = 0.42      # wide smile
COMPRESS_THRESH = 0.28      # pressed/hidden lips

# Brow compression: distance between inner brows / face_width
# Below BROW_COMPRESS_THRESH → angry (furrowed brows)
BROW_COMPRESS_THRESH = 0.040   # Lowered from 0.055 for better angry detection

# Hand proximity: fraction of face_height within which hand = "touching"
HAND_LIPS_THRESH     = 0.18   # hand near mouth/lips zone
HAND_FOREHEAD_THRESH = 0.22   # hand near forehead zone

# Geometry blend weight: how strongly geometry overrides DeepFace probs (0-1)
GEOMETRY_BLEND = 0.70   # Increased from 0.55 to give geometry cues more influence

# Stress floor when hand-on-face/forehead is detected
HAND_LIPS_STRESS_FLOOR     = 42.0
HAND_FOREHEAD_STRESS_FLOOR = 72.0

EMOTION_STRESS_MAP = {
    "happy":    0.00,
    "neutral":  0.10,
    "surprise": 0.30,
    "sad":      0.50,
    "disgust":  0.60,
    "angry":    0.80,
    "fear":     1.00,
}

ALL_EMOTIONS = ["happy", "neutral", "surprise", "sad", "disgust", "angry", "fear"]


# ─────────────────────────────────────────────────────────────────
#  MEDIAPIPE INIT
# ─────────────────────────────────────────────────────────────────

mp_face_mesh = mp_solutions.face_mesh
mp_pose      = mp_solutions.pose
mp_hands     = mp_solutions.hands
mp_drawing   = mp_solutions.drawing_utils

face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.35,  # Lowered from 0.5 to catch smaller faces
    min_tracking_confidence=0.35,   # Lowered to improve tracking of distant faces
)
pose_detector = mp_pose.Pose(
    min_detection_confidence=0.35,  # Lowered for better posture detection
    min_tracking_confidence=0.35,
)
hand_detector = mp_hands.Hands(
    max_num_hands=2,
    min_detection_confidence=0.35,  # Lowered for hand detection
    min_tracking_confidence=0.35,
)


# ─────────────────────────────────────────────────────────────────
#  FACIAL GEOMETRY ANALYSER
# ─────────────────────────────────────────────────────────────────

# MediaPipe face mesh landmark indices
# Lips
LIP_LEFT       = 61    # left corner of mouth
LIP_RIGHT      = 291   # right corner of mouth
LIP_TOP_CENTER = 13    # upper lip centre
LIP_BOT_CENTER = 14    # lower lip centre
UPPER_LIP_TOP  = 0     # top of upper lip (philtrum)

# Brows (inner corners)
L_BROW_INNER   = 55    # left inner brow
R_BROW_INNER   = 285   # right inner brow
L_BROW_TOP     = 52    # left brow top
R_BROW_TOP     = 282   # right brow top

# Forehead reference
FOREHEAD_TOP   = 10    # top centre of forehead
NOSE_BRIDGE    = 6     # nose bridge (for face height reference)

# Face width reference
FACE_LEFT      = 234
FACE_RIGHT     = 454

# Eyes (for squint detection = angry indicator)
L_EYE_TOP      = 159   # left eye top
L_EYE_BOT      = 145   # left eye bottom
L_EYE_LEFT     = 33    # left eye inner corner
L_EYE_RIGHT    = 133   # left eye outer corner
R_EYE_TOP      = 386   # right eye top
R_EYE_BOT      = 374   # right eye bottom
R_EYE_LEFT     = 362   # right eye inner corner
R_EYE_RIGHT    = 263   # right eye outer corner

# Eye aspect ratio threshold for squint (anger indicator)
EYE_SQUINT_THRESH = 0.20   # Below this = squinting (eyes narrowed)


class GeometryCues:
    """
    Derives smile, lip-compression and brow-furrow signals purely from
    face-mesh landmark geometry. Returns probability adjustments that
    blend with DeepFace output.
    """

    def __init__(self):
        self.active_cues  = []   # list of active cue names for HUD display
        self.lip_ratio    = 0.0
        self.brow_dist    = 0.0
        self.lip_openness = 0.0
        self.eye_squint   = 0.0  # average eye aspect ratio

    def analyse(self, landmarks, fw, fh):
        """
        Returns a dict of {emotion: override_prob} for any active cues.
        Empty dict = no geometry cues firing.
        """
        self.active_cues = []

        def px(idx):
            return np.array([landmarks[idx].x * fw, landmarks[idx].y * fh])

        # ── Face scale references ─────────────────────────────────
        face_w = max(np.linalg.norm(px(FACE_LEFT) - px(FACE_RIGHT)), 1)
        face_h = max(abs(px(FOREHEAD_TOP)[1] - px(NOSE_BRIDGE)[1]) * 3, 1)
        # lip width
        lip_w  = np.linalg.norm(px(LIP_LEFT) - px(LIP_RIGHT))
        # lip openness (vertical gap between upper and lower lip)
        lip_open = np.linalg.norm(px(LIP_TOP_CENTER) - px(LIP_BOT_CENTER))
        # inner brow distance
        brow_d  = np.linalg.norm(px(L_BROW_INNER) - px(R_BROW_INNER))
        # brow height vs forehead (lower brow = more furrowed)
        l_brow_h = abs(px(L_BROW_TOP)[1] - px(FOREHEAD_TOP)[1]) / face_h
        r_brow_h = abs(px(R_BROW_TOP)[1] - px(FOREHEAD_TOP)[1]) / face_h
        avg_brow_h = (l_brow_h + r_brow_h) / 2
        
        # Eye aspect ratio (vertical gap / horizontal width)
        # Smaller = squinting = angry indicator
        l_eye_v = np.linalg.norm(px(L_EYE_TOP) - px(L_EYE_BOT))
        l_eye_h = np.linalg.norm(px(L_EYE_LEFT) - px(L_EYE_RIGHT))
        r_eye_v = np.linalg.norm(px(R_EYE_TOP) - px(R_EYE_BOT))
        r_eye_h = np.linalg.norm(px(R_EYE_LEFT) - px(R_EYE_RIGHT))
        l_ear = l_eye_v / (l_eye_h + 1e-6)
        r_ear = r_eye_v / (r_eye_h + 1e-6)
        avg_ear = (l_ear + r_ear) / 2

        self.lip_ratio    = lip_w / face_w
        self.brow_dist    = brow_d / face_w
        self.lip_openness = lip_open / face_w
        self.eye_squint   = avg_ear

        overrides = {}

        # ── CUE 1: SMILE  (wide lip corners + some openness) ─────
        if self.lip_ratio > SMILE_THRESH:
            overrides = {"happy": 0.85, "neutral": 0.10,
                         "surprise": 0.03, "sad": 0.01,
                         "disgust": 0.00, "angry": 0.00, "fear": 0.01}
            self.active_cues.append(f"Smile ({self.lip_ratio:.2f})")

        # ── CUE 2: PRESSED / HIDDEN LIPS (narrow + closed) ───────
        elif self.lip_ratio < COMPRESS_THRESH and self.lip_openness < 0.04:
            # Compressed lips indicate sadness or stress; boost sad higher
            overrides = {"happy": 0.00, "neutral": 0.03,
                         "surprise": 0.03, "sad": 0.50,
                         "disgust": 0.10, "angry": 0.10, "fear": 0.24}
            self.active_cues.append(f"Lip compress ({self.lip_ratio:.2f})")

        # ── CUE 3: BROW FURROW (inner brows close together) ──────
        if self.brow_dist < BROW_COMPRESS_THRESH and "Smile" not in str(self.active_cues):
            angry_boost = {"happy": 0.00, "neutral": 0.03,
                           "surprise": 0.02, "sad": 0.15,
                           "disgust": 0.15, "angry": 0.65, "fear": 0.00}  # Increased angry from 0.50 to 0.65
            if overrides:
                # merge: average with existing override
                for e in ALL_EMOTIONS:
                    overrides[e] = (overrides.get(e, 0) + angry_boost.get(e, 0)) / 2
            else:
                overrides = angry_boost
            self.active_cues.append(f"Brow furrow ({self.brow_dist:.3f})")

        # ── CUE 4: EYE SQUINT (narrowed eyes) ────────────────────
        if self.eye_squint < EYE_SQUINT_THRESH and "Smile" not in str(self.active_cues):
            squint_boost = {"happy": 0.00, "neutral": 0.02,
                           "surprise": 0.00, "sad": 0.10,
                           "disgust": 0.20, "angry": 0.60, "fear": 0.08}
            if overrides:
                for e in ALL_EMOTIONS:
                    overrides[e] = (overrides.get(e, 0) + squint_boost.get(e, 0)) / 2
            else:
                overrides = squint_boost
            self.active_cues.append(f"Eye squint ({self.eye_squint:.2f})")

        # Normalise overrides to sum to 1
        if overrides:
            total = sum(overrides.values()) or 1.0
            overrides = {e: v / total for e, v in overrides.items()}

        return overrides


# ─────────────────────────────────────────────────────────────────
#  HAND-NEAR-FACE DETECTOR
# ─────────────────────────────────────────────────────────────────

class HandFaceDetector:
    """
    Detects whether any hand landmark is inside the face region,
    specifically distinguishing lips zone vs forehead zone.
    Returns (stress_floor, label) or (0, None).
    """

    def __init__(self):
        self.active_label = None
        self.stress_floor = 0.0

    def analyse(self, hand_results, face_bbox_xywh, fw, fh):
        """
        hand_results: result from mp_hands.Hands.process()
        face_bbox_xywh: (x, y, w, h) of face in pixels
        """
        self.active_label = None
        self.stress_floor = 0.0

        if not hand_results.multi_hand_landmarks or face_bbox_xywh is None:
            return

        fx, fy, fw_face, fh_face = face_bbox_xywh
        face_cx = fx + fw_face / 2
        face_cy = fy + fh_face / 2

        # Define zones as fractions of face_height from top of face bbox
        # Forehead zone: top 30% of face bbox
        # Lips zone: 65-85% of face bbox from top
        forehead_y_min = fy
        forehead_y_max = fy + fh_face * 0.35
        lips_y_min     = fy + fh_face * 0.60
        lips_y_max     = fy + fh_face * 0.85

        for hand_lm in hand_results.multi_hand_landmarks:
            for lm in hand_lm.landmark:
                hx = lm.x * fw
                hy = lm.y * fh

                # Check if hand point is within face horizontal range
                in_face_x = (fx - fh_face * 0.2) < hx < (fx + fw_face + fh_face * 0.2)

                if in_face_x:
                    if forehead_y_min <= hy <= forehead_y_max:
                        self.active_label = "Hand on forehead"
                        self.stress_floor = HAND_FOREHEAD_STRESS_FLOOR
                        return   # highest priority, return immediately

                    if lips_y_min <= hy <= lips_y_max:
                        if self.stress_floor < HAND_LIPS_STRESS_FLOOR:
                            self.active_label = "Hand on lips"
                            self.stress_floor = HAND_LIPS_STRESS_FLOOR


# ─────────────────────────────────────────────────────────────────
#  EMOTION DETECTOR  (DeepFace + geometry blend)
# ─────────────────────────────────────────────────────────────────

class AudioRecorder:
    def __init__(self, filename=AUDIO_OUTPUT_FILE, samplerate=AUDIO_SAMPLE_RATE, channels=AUDIO_CHANNELS):
        self.filename = filename
        self.samplerate = samplerate
        self.channels = channels
        self._stream = None
        self._frames = []
        self._lock = threading.Lock()

    def _callback(self, indata, frames, time_info, status):
        if status:
            print(f"Audio input status: {status}")
        with self._lock:
            self._frames.append(indata.copy())

    def start(self):
        try:
            self._frames = []
            self._stream = sd.InputStream(
                samplerate=self.samplerate,
                channels=self.channels,
                callback=self._callback,
            )
            self._stream.start()
            print(f"Audio recording started ({self.filename})")
            return True
        except Exception as exc:
            print(f"WARNING: Audio recording could not start: {exc}")
            self._stream = None
            return False

    def stop(self):
        if self._stream is None:
            return False
        try:
            self._stream.stop()
            self._stream.close()
            self._stream = None
            with self._lock:
                if not self._frames:
                    print("No audio was captured.")
                    return False
                data = np.concatenate(self._frames, axis=0)
            sf.write(self.filename, data, self.samplerate)
            print(f"Audio recording saved to {self.filename}")
            return True
        except Exception as exc:
            print(f"WARNING: Failed to save audio recording: {exc}")
            return False


def _upload_audio_to_assemblyai(file_path, api_key):
    def _read_file(path, chunk_size=5242880):
        with open(path, "rb") as f:
            while True:
                data = f.read(chunk_size)
                if not data:
                    break
                yield data

    headers = {"authorization": api_key}
    print(f"Uploading audio to AssemblyAI: {file_path}")
    response = requests.post(
        ASSEMBLYAI_UPLOAD_URL,
        headers=headers,
        data=_read_file(file_path),
    )
    response.raise_for_status()
    upload_url = response.json().get("upload_url")
    if not upload_url:
        raise RuntimeError("AssemblyAI upload did not return a valid URL")
    return upload_url


def _request_assemblyai_transcript(audio_url, api_key):
    headers = {"authorization": api_key, "content-type": "application/json"}
    payload = {
        "audio_url": audio_url,
        "disfluencies": True,
        "format_text": False,
        "word_boost": FILLER_WORDS,
        "boost_param": "high",
    }
    response = requests.post(ASSEMBLYAI_TRANSCRIPT_URL, headers=headers, json=payload)
    response.raise_for_status()
    transcript_id = response.json().get("id")
    if not transcript_id:
        raise RuntimeError("AssemblyAI transcript request failed")

    polling_url = f"{ASSEMBLYAI_TRANSCRIPT_URL}/{transcript_id}"
    while True:
        time.sleep(TRANSCRIPT_POLL_INTERVAL)
        poll_response = requests.get(polling_url, headers=headers)
        poll_response.raise_for_status()
        status = poll_response.json().get("status")
        if status == "completed":
            return poll_response.json().get("text", "")
        if status == "error":
            raise RuntimeError(poll_response.json().get("error", "Unknown AssemblyAI error"))
        print("Waiting for AssemblyAI transcription...", status)


def transcribe_audio_with_assemblyai(file_path):
    api_key = os.getenv(ASSEMBLYAI_API_KEY_ENV)
    if not api_key:
        print(f"WARNING: Environment variable {ASSEMBLYAI_API_KEY_ENV} not set. Skipping transcription.")
        return None
    if not os.path.exists(file_path):
        print(f"WARNING: Audio file not found: {file_path}")
        return None
    try:
        upload_url = _upload_audio_to_assemblyai(file_path, api_key)
        transcript = _request_assemblyai_transcript(upload_url, api_key)
        if not transcript:
            print("AssemblyAI transcription completed, but no speech was detected.")
            return None
        print("AssemblyAI transcription completed.")
        return transcript
    except Exception as exc:
        print(f"ERROR: AssemblyAI transcription failed: {exc}")
        return None


def _ensure_output_files_removed():
    for path in (VIDEO_OUTPUT_FILE, AUDIO_OUTPUT_FILE):
        try:
            if os.path.exists(path):
                os.remove(path)
                print(f"Removed previous file: {path}")
        except Exception as exc:
            print(f"WARNING: Could not delete previous file {path}: {exc}")


def _save_transcript_file(transcript_text, timestamp):
    transcript_path = f"{RECORDING_PREFIX}_transcript_{timestamp}.txt"
    try:
        with open(transcript_path, "w", encoding="utf-8") as f:
            f.write(transcript_text)
        print(f"Transcript saved to {transcript_path}")
    except Exception as exc:
        print(f"WARNING: Failed to save transcript file: {exc}")
        transcript_path = None
    return transcript_path


def _save_session_report(report_data, timestamp):
    report_path = f"{RECORDING_PREFIX}_session_report_{timestamp}.json"
    try:
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)
        print(f"Session report saved to {report_path}")
    except Exception as exc:
        print(f"WARNING: Failed to save session report: {exc}")
        report_path = None
    return report_path


class EmotionDetector:
    def __init__(self):
        self._prob_history = deque(maxlen=EMOTION_SMOOTH_FRAMES)
        self._uniform      = {e: 1.0 / len(ALL_EMOTIONS) for e in ALL_EMOTIONS}
        self._prob_history.append(self._uniform.copy())
        self.geometry      = GeometryCues()

    def _adaptive_geometry_blend(self, face_bbox_xywh, frame_shape):
        """
        Reduce geometry blend weight when face is far away (small).
        Face coverage < 5% → use 0.30 blend (mostly DeepFace)
        Face coverage 5-15% → use 0.50 blend (balanced)
        Face coverage > 15% → use GEOMETRY_BLEND (0.70, mostly geometry)
        """
        if face_bbox_xywh is None:
            return GEOMETRY_BLEND
        
        x, y, w, h = face_bbox_xywh
        fh_f, fw_f = frame_shape[:2]
        frame_pixels = fh_f * fw_f
        face_pixels = w * h
        face_coverage = (face_pixels / frame_pixels) * 100 if frame_pixels > 0 else 0
        
        if face_coverage < 5:
            return 0.25    # Very small face: trust DeepFace 75%
        elif face_coverage < 15:
            return 0.40    # Small face: balanced blend
        else:
            return GEOMETRY_BLEND  # Normal/close face: use higher geometry blend

    def update(self, frame, face_bbox_xywh, face_landmarks):
        """
        Runs DeepFace on face crop, then blends with geometry cues (adaptive).
        Returns (smoothed_probs, dominant_emotion).
        """
        # ── DeepFace on face crop ─────────────────────────────────
        deepface_probs = None
        if face_bbox_xywh is not None:
            x, y, w, h = face_bbox_xywh
            fh_f, fw_f = frame.shape[:2]
            x1 = max(0, x - FACE_CROP_PAD)
            y1 = max(0, y - FACE_CROP_PAD)
            x2 = min(fw_f, x + w + FACE_CROP_PAD)
            y2 = min(fh_f, y + h + FACE_CROP_PAD)
            crop = frame[y1:y2, x1:x2]
            if crop.size > 0:
                try:
                    res = DeepFace.analyze(crop, actions=["emotion"],
                                          enforce_detection=False, silent=True)
                    raw = res[0]["emotion"]
                    total = sum(raw.values()) or 1.0
                    deepface_probs = {e: raw.get(e, raw.get(e.capitalize(), 0)) / total
                                      for e in ALL_EMOTIONS}
                except Exception:
                    pass

        # ── Geometry cues ─────────────────────────────────────────
        geo_overrides = {}
        if face_landmarks is not None:
            fw_frame = frame.shape[1]
            fh_frame = frame.shape[0]
            # Only use geometry cues if face is reasonably large (> 5% of frame)
            if face_bbox_xywh is not None:
                x, y, w, h = face_bbox_xywh
                face_coverage = (w * h) / (fw_frame * fh_frame) * 100
                if face_coverage > 5:  # Only apply geometry for larger faces
                    geo_overrides = self.geometry.analyse(face_landmarks, fw_frame, fh_frame)
            else:
                geo_overrides = self.geometry.analyse(face_landmarks, fw_frame, fh_frame)

        # ── Blend DeepFace + geometry (with adaptive weighting) ───
        adaptive_blend = self._adaptive_geometry_blend(face_bbox_xywh, frame.shape)
        if deepface_probs is not None:
            if geo_overrides:
                blended = {e: (1 - adaptive_blend) * deepface_probs.get(e, 0)
                              + adaptive_blend * geo_overrides.get(e, 0)
                           for e in ALL_EMOTIONS}
            else:
                blended = deepface_probs
            self._prob_history.append(blended)
        elif geo_overrides:
            # No DeepFace result this frame but geometry fired — use geo alone
            self._prob_history.append(geo_overrides)

        # ── Smooth over history ───────────────────────────────────
        smooth = {e: float(np.mean([p.get(e, 0) for p in self._prob_history]))
                  for e in ALL_EMOTIONS}
        dominant = max(smooth, key=smooth.get)
        return smooth, dominant

    def stress_contribution(self, smooth_probs: dict) -> float:
        score = sum(smooth_probs.get(e, 0) * EMOTION_STRESS_MAP.get(e, 0.2)
                    for e in ALL_EMOTIONS)
        return round(min(score * 100, 100), 1)


# ─────────────────────────────────────────────────────────────────
#  GAZE
# ─────────────────────────────────────────────────────────────────

L_IRIS = [474, 475, 476, 477]
R_IRIS = [469, 470, 471, 472]
L_EYE  = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
R_EYE  = [33,   7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]

def get_gaze_score(landmarks, fw, fh) -> float:
    def offset(iris_ids, eye_ids):
        iris = np.array([(landmarks[i].x * fw, landmarks[i].y * fh) for i in iris_ids])
        eye  = np.array([(landmarks[i].x * fw, landmarks[i].y * fh) for i in eye_ids])
        cx, cy = iris[:, 0].mean(), iris[:, 1].mean()
        ew = max(eye[:, 0].max() - eye[:, 0].min(), 1)
        eh = max(eye[:, 1].max() - eye[:, 1].min(), 1)
        dx = abs((cx - eye[:, 0].min()) / ew - 0.5) * 2
        dy = abs((cy - eye[:, 1].min()) / eh - 0.5) * 2
        return dx, dy
    ldx, ldy = offset(L_IRIS, L_EYE)
    rdx, rdy = offset(R_IRIS, R_EYE)
    return round(max(0.0, 100.0 - ((ldx + rdx + ldy + rdy) / 4) * 200.0), 1)


# ─────────────────────────────────────────────────────────────────
#  HEAD POSE
# ─────────────────────────────────────────────────────────────────

_3D_FACE = np.array([
    (  0.0,    0.0,    0.0),
    (  0.0, -330.0,  -65.0),
    (-225.0,  170.0, -135.0),
    ( 225.0,  170.0, -135.0),
    (-150.0, -150.0, -125.0),
    ( 150.0, -150.0, -125.0),
], dtype=np.float64)
_POSE_IDS = [1, 152, 263, 33, 287, 57]

def get_head_pose(landmarks, fw, fh):
    pts2d = np.array([(landmarks[i].x * fw, landmarks[i].y * fh)
                      for i in _POSE_IDS], dtype=np.float64)
    cam = np.array([[fw, 0, fw/2], [0, fw, fh/2], [0, 0, 1]], dtype=np.float64)
    ok, rvec, _ = cv2.solvePnP(_3D_FACE, pts2d, cam, np.zeros((4,1)),
                                flags=cv2.SOLVEPNP_ITERATIVE)
    if not ok:
        return 0.0, 0.0, 0.0
    rmat, _ = cv2.Rodrigues(rvec)
    sy    = np.sqrt(rmat[0,0]**2 + rmat[1,0]**2)
    pitch = np.degrees(np.arctan2(-rmat[2,0], sy))
    yaw   = np.degrees(np.arctan2( rmat[1,0], rmat[0,0]))
    roll  = np.degrees(np.arctan2( rmat[2,1], rmat[2,2]))
    return round(pitch,1), round(yaw,1), round(roll,1)


# ─────────────────────────────────────────────────────────────────
#  BLINK
# ─────────────────────────────────────────────────────────────────

L_EAR_PTS = [362, 385, 387, 263, 373, 380]
R_EAR_PTS = [ 33, 160, 158, 133, 153, 144]
EAR_THRESH          = 0.20
BLINK_CONSEC_FRAMES = 2

def calc_ear(landmarks, ids, fw, fh) -> float:
    pts = np.array([(landmarks[i].x * fw, landmarks[i].y * fh) for i in ids])
    A = np.linalg.norm(pts[1] - pts[5])
    B = np.linalg.norm(pts[2] - pts[4])
    C = np.linalg.norm(pts[0] - pts[3])
    return (A + B) / (2.0 * C + 1e-6)

class BlinkTracker:
    def __init__(self):
        self.total_blinks = 0
        self._consec      = 0
        self._timestamps  = deque()

    def update(self, avg_ear: float) -> None:
        if avg_ear < EAR_THRESH:
            self._consec += 1
        else:
            if self._consec >= BLINK_CONSEC_FRAMES:
                self.total_blinks += 1
                self._timestamps.append(time.time())
            self._consec = 0

    def blinks_per_minute(self) -> float:
        now = time.time()
        while self._timestamps and self._timestamps[0] < now - BLINK_WINDOW_SEC:
            self._timestamps.popleft()
        if not self._timestamps:
            return 0.0
        window = min(BLINK_WINDOW_SEC, now - self._timestamps[0] + 0.001)
        return round(len(self._timestamps) / window * 60, 1)

    def stress_contribution(self) -> float:
        bpm = self.blinks_per_minute()
        stress = (bpm - BLINK_NORMAL_BPM) / (BLINK_STRESS_BPM - BLINK_NORMAL_BPM)
        return round(float(np.clip(stress, 0.0, 1.0)) * 100, 1)


# ─────────────────────────────────────────────────────────────────
#  POSTURE
# ─────────────────────────────────────────────────────────────────

def analyse_posture(pose_lm, fw, fh):
    lm = pose_lm.landmark
    issues = []

    def pt(idx):
        return np.array([lm[idx].x * fw, lm[idx].y * fh])

    LS = mp_pose.PoseLandmark.LEFT_SHOULDER.value
    RS = mp_pose.PoseLandmark.RIGHT_SHOULDER.value
    LH = mp_pose.PoseLandmark.LEFT_HIP.value
    RH = mp_pose.PoseLandmark.RIGHT_HIP.value
    NO = mp_pose.PoseLandmark.NOSE.value

    ls, rs  = pt(LS), pt(RS)
    lh, rh  = pt(LH), pt(RH)
    nose    = pt(NO)
    mid_sh  = (ls + rs) / 2
    mid_hp  = (lh + rh) / 2

    if abs(ls[1] - rs[1]) / fh > 0.04:
        issues.append("Uneven shoulders")
    if abs(mid_sh[0] - mid_hp[0]) / fw > 0.05:
        issues.append("Lateral lean")
    if abs(nose[0] - mid_sh[0]) / fw > 0.08:
        issues.append("Head off-centre")
    if (mid_hp[1] - mid_sh[1]) / fh < 0.15:
        issues.append("Too close / slouch")

    return max(0, 100 - len(issues) * 25), issues


# ─────────────────────────────────────────────────────────────────
#  STRESS FUSION  (EMA + hand-face floor)
# ─────────────────────────────────────────────────────────────────

class StressFusion:
    def __init__(self):
        self._ema = 10.0

    def update(self, emotion_stress, gaze_score, posture_score,
               blink_stress, hand_stress_floor: float) -> float:
        raw = (
            STRESS_WEIGHTS["emotion"] * emotion_stress +
            STRESS_WEIGHTS["gaze"]    * (100.0 - gaze_score) +
            STRESS_WEIGHTS["posture"] * (100.0 - posture_score) +
            STRESS_WEIGHTS["blink"]   * blink_stress
        )
        self._ema = STRESS_EMA_ALPHA * raw + (1 - STRESS_EMA_ALPHA) * self._ema
        # Hand-face gesture forces a minimum stress floor instantly
        result = max(self._ema, hand_stress_floor)
        return round(result, 1)


# ─────────────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────────────

def face_bbox_from_mesh(landmarks, fw, fh):
    xs = [lm.x * fw for lm in landmarks]
    ys = [lm.y * fh for lm in landmarks]
    x, y = int(min(xs)), int(min(ys))
    return x, y, int(max(xs)) - x, int(max(ys)) - y


# ─────────────────────────────────────────────────────────────────
#  DASHBOARD COLORS
# ─────────────────────────────────────────────────────────────────

# Contemporary color scheme
C_SURFACE_BG      = (245, 245, 250)  # Light page surface
C_CARD_BG         = (255, 255, 255)  # Card surface
C_BORDER_LIGHT    = (220, 225, 235)  # Light border
C_ACCENT          = (100, 160, 255)  # Bright blue
C_TEXT_BLACK      = ( 30,  40,  55)  # Dark text
C_TEXT_GRAY       = (120, 130, 145)  # Dark gray
C_SUCCESS         = ( 80, 220, 120)  # Green
C_WARNING         = (255, 180,  80)  # Orange
C_DANGER          = (255, 100, 100)  # Red
C_NEUTRAL         = (140, 150, 160)  # Neutral
C_SUCCESS_MOD     = (110, 230, 145)  # Soft success
C_WARNING_MOD     = (255, 205, 120)  # Soft warning
C_DANGER_MOD      = (255, 135, 135)  # Soft danger
C_NEUTRAL_MOD     = (150, 160, 170)  # Soft neutral

def draw_clean_bar(frame, x, y, width, height, value, label, color=None):
    """Draw a compact progress bar for HUD metrics."""
    col = color or (C_SUCCESS_MOD if value >= 75 else C_WARNING_MOD if value >= 50 else C_DANGER_MOD)

    cv2.rectangle(frame, (x, y), (x + width, y + height), (28, 34, 46), -1)
    fill_width = int(width * np.clip(value, 0, 100) / 100)
    if fill_width > 0:
        cv2.rectangle(frame, (x, y), (x + fill_width, y + height), col, -1)

    cv2.rectangle(frame, (x, y), (x + width, y + height), C_ACCENT, 1)
    cv2.putText(frame, label, (x + 6, y + height - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.38, C_TEXT_GRAY, 1)
    cv2.putText(frame, f"{value:.0f}%", (x + width - 46, y + height - 2), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.38, C_TEXT_GRAY, 1)


def draw_light_card(frame, x, y, width, height, title, content_lines, accent_color=C_ACCENT):
    """Draw a clean white card on the dashboard."""
    cv2.rectangle(frame, (x, y), (x + width, y + height), C_CARD_BG, -1)
    cv2.rectangle(frame, (x, y), (x + width, y + height), C_BORDER_LIGHT, 1)
    cv2.putText(frame, title, (x + 16, y + 28), cv2.FONT_HERSHEY_DUPLEX, 0.7, accent_color, 2)
    cv2.line(frame, (x + 16, y + 34), (x + width - 16, y + 34), accent_color, 2)

    cy = y + 52
    for line in content_lines:
        cv2.putText(frame, line, (x + 16, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.45, C_TEXT_BLACK, 1)
        cy += 20

    return y + height


def draw_emotion_meter(frame, x, y, width, probs):
    """Draw a full emotion meter list for all tracked emotions."""
    emotions = ["happy", "neutral", "surprise", "sad", "disgust", "angry", "fear"]
    for em in emotions:
        pct = probs.get(em, 0.0) * 100
        color = (C_SUCCESS_MOD if pct >= 75 else C_WARNING_MOD if pct >= 50 else C_DANGER_MOD if pct >= 25 else C_NEUTRAL_MOD)
        draw_clean_bar(frame, x, y, width, 18, pct, em.capitalize(), color)
        y += 26
    return y


def draw_hud(frame, data: dict):
    fh, fw = frame.shape[:2]
    panel_width = 420
    card_pad = 16

    hand_label = data.get("hand_label")
    alert_lines = []
    cues = data.get("geo_cues", []) or []
    if cues:
        alert_lines.extend([f"• {cue}" for cue in cues[:2]])
    if data.get("posture_issues"):
        alert_lines.extend([f"• {iss}" for iss in data["posture_issues"][:2]])

    gesture_height = 92 if hand_label else 0
    alert_height = len(alert_lines) * 20 + 48 if alert_lines else 0
    emotion_rows = 7
    panel_content_height = (
        34 + 24 + 28 + 66 + 16 + 3 * 28 + 10 + 40 + gesture_height + 24 + emotion_rows * 26 + 10 + 56 + 12 + alert_height + 16
    )
    display_h = max(fh, panel_content_height + card_pad)
    display = np.full((display_h, fw + panel_width, 3), C_SURFACE_BG, dtype=np.uint8)

    # Video panel
    card_x = card_pad
    card_y = card_pad
    card_w = fw - card_pad * 2
    card_h = int(display_h * 0.65)
    cv2.rectangle(display, (card_x, card_y), (card_x + card_w, card_y + card_h), C_CARD_BG, -1)
    cv2.rectangle(display, (card_x, card_y), (card_x + card_w, card_y + card_h), C_BORDER_LIGHT, 1)
    cv2.putText(display, "VIDEO", (card_x + 18, card_y + 34), cv2.FONT_HERSHEY_SIMPLEX, 0.95, C_ACCENT, 2)
    cv2.putText(display, "Camera screen", (card_x + 18, card_y + 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, C_TEXT_GRAY, 1)

    preview_x = card_x + 14
    preview_y = card_y + 80
    preview_w = card_w - 28
    preview_h = card_h - 96
    if preview_w > 0 and preview_h > 0:
        preview = cv2.resize(frame, (preview_w, preview_h))
        display[preview_y:preview_y + preview_h, preview_x:preview_x + preview_w] = preview
        cv2.rectangle(display, (preview_x, preview_y), (preview_x + preview_w, preview_y + preview_h), C_BORDER_LIGHT, 1)

    # Stats panel
    panel_x = fw + card_pad
    panel_y = card_pad
    panel_h = display_h - card_pad * 2
    panel_w = panel_width - card_pad * 2
    cv2.rectangle(display, (panel_x, panel_y), (panel_x + panel_w, panel_y + panel_h), C_CARD_BG, -1)
    cv2.rectangle(display, (panel_x, panel_y), (panel_x + panel_w, panel_y + panel_h), C_BORDER_LIGHT, 1)

    # Stats header
    heading_x = panel_x + 20
    y = panel_y + 34
    cv2.putText(display, "STATS", (heading_x, y), cv2.FONT_HERSHEY_DUPLEX, 1.1, C_TEXT_BLACK, 2)
    y += 24
    cv2.line(display, (heading_x, y), (panel_x + panel_w - 20, y), C_BORDER_LIGHT, 1)
    y += 28

    # Prominent blink counter at top
    blink_card_h = 66
    cv2.rectangle(display, (heading_x, y), (heading_x + panel_w - 40, y + blink_card_h), C_CARD_BG, -1)
    cv2.rectangle(display, (heading_x, y), (heading_x + panel_w - 40, y + blink_card_h), C_BORDER_LIGHT, 1)
    cv2.putText(display, "Blinks", (heading_x + 12, y + 24), cv2.FONT_HERSHEY_DUPLEX, 0.8, C_TEXT_BLACK, 2)
    cv2.putText(display, f"{data['blink_total']}", (heading_x + 12, y + 52), cv2.FONT_HERSHEY_SIMPLEX, 1.2, C_ACCENT, 2)
    cv2.putText(display, f"{data['blink_bpm']:.1f}/min", (heading_x + 180, y + 52), cv2.FONT_HERSHEY_SIMPLEX, 0.9, C_TEXT_GRAY, 1)
    y += blink_card_h + 16

    # Core metrics
    metrics = [
        ("Emotion Stress", data["emotion_stress"]),
        ("Gaze Focus", data["gaze_score"]),
        ("Posture", data["posture_score"]),
    ]
    for label, value in metrics:
        draw_clean_bar(display, heading_x, y, panel_w - 40, 18, value, label)
        y += 28

    y += 10
    stress_col = C_SUCCESS if data["stress_score"] <= 25 else C_WARNING if data["stress_score"] <= 50 else C_DANGER
    draw_clean_bar(display, heading_x, y, panel_w - 40, 20, data["stress_score"], "OVERALL STRESS", stress_col)
    y += 40

    # Gesture/Hand alerts card
    hand_cues = [data["hand_label"]] if data.get("hand_label") else []
    if hand_cues:
        gesture_card_h = 76
        cv2.rectangle(display, (heading_x, y), (heading_x + panel_w - 40, y + gesture_card_h), C_CARD_BG, -1)
        cv2.rectangle(display, (heading_x, y), (heading_x + panel_w - 40, y + gesture_card_h), C_DANGER, 2)
        cv2.putText(display, "⚠ GESTURE DETECTED", (heading_x + 12, y + 26), cv2.FONT_HERSHEY_DUPLEX, 0.65, C_DANGER, 2)
        gesture_text = f"• {hand_cues[0]}"
        cv2.putText(display, gesture_text, (heading_x + 16, y + 52), cv2.FONT_HERSHEY_SIMPLEX, 0.55, C_TEXT_BLACK, 1)
        y += gesture_card_h + 16

    # Full emotion meter
    cv2.putText(display, "Emotion Meter", (heading_x, y), cv2.FONT_HERSHEY_DUPLEX, 0.75, C_TEXT_BLACK, 1)
    y += 24
    y = draw_emotion_meter(display, heading_x, y, panel_w - 40, data["emotion_probs"])
    y += 10

    # Status card
    status_lines = [
        f"Head Pose: P{data['head_pose'][0]:.0f}° Y{data['head_pose'][1]:.0f}° R{data['head_pose'][2]:.0f}°"
    ]
    y = draw_light_card(display, heading_x, y, panel_w - 40, 56, "STATUS", status_lines)
    y += 12

    # Remaining alerts
    alert_lines = []
    cues = data.get("geo_cues", [])
    if cues:
        alert_lines.extend([f"• {cue}" for cue in cues[:2]])
    if data["posture_issues"]:
        alert_lines.extend([f"• {iss}" for iss in data["posture_issues"][:2]])
    if alert_lines:
        draw_light_card(display, heading_x, y, panel_w - 40, len(alert_lines) * 20 + 48, "ALERTS", alert_lines, C_DANGER)

    return display


# ─────────────────────────────────────────────────────────────────
#  SESSION STATS
# ─────────────────────────────────────────────────────────────────

class SessionStats:
    def __init__(self):
        self.start        = time.time()
        self.frames       = 0
        self.emotion_probs_hist = []  # Store full probability dicts
        self.gaze_hist    = []
        self.posture_hist = []
        self.stress_hist  = []

    def push(self, data):
        self.frames += 1
        self.emotion_probs_hist.append(data["emotion_probs"])  # Store full probs dict
        self.gaze_hist.append(data["gaze_score"])
        self.posture_hist.append(data["posture_score"])
        self.stress_hist.append(data["stress_score"])

    def report(self, blink_tracker) -> dict:
        dur = time.time() - self.start
        avg = lambda lst: round(float(np.mean(lst)), 1) if lst else 0.0
        
        # Calculate average emotion probabilities across session
        avg_emotion_probs = {}
        if self.emotion_probs_hist:
            all_emotions = list(self.emotion_probs_hist[0].keys())
            for em in all_emotions:
                avg_emotion_probs[em] = np.mean([p.get(em, 0) for p in self.emotion_probs_hist])
        
        # Get top 3 emotions
        top_3 = sorted(avg_emotion_probs.items(), key=lambda x: x[1], reverse=True)[:3] if avg_emotion_probs else []
        dominant = top_3[0][0] if top_3 else "N/A"
        
        print("\n" + "=" * 56)
        print("  IntelliHIRE  -  Session Report")
        print("=" * 56)
        print(f"  Duration          : {dur:.1f}s  ({self.frames} frames)")
        print(f"  Top 3 Emotions    :")
        for rank, (emotion, prob) in enumerate(top_3, 1):
            print(f"    {rank}. {emotion.capitalize():12} : {prob*100:5.1f}%")
        print(f"  Avg Gaze Score    : {avg(self.gaze_hist)}%")
        print(f"  Avg Posture Score : {avg(self.posture_hist)}%")
        print(f"  Avg Stress Score  : {avg(self.stress_hist)}%")
        print(f"  Peak Stress       : {round(max(self.stress_hist, default=0), 1)}%")
        print(f"  Total Blinks      : {blink_tracker.total_blinks}"
              f"  ({blink_tracker.blinks_per_minute()} /min)")
        print("=" * 56)
        return {
            "duration_sec":     round(dur, 1),
            "dominant_emotion": dominant,
            "top_3_emotions":   [(em, round(prob*100, 1)) for em, prob in top_3],
            "avg_gaze":         avg(self.gaze_hist),
            "avg_posture":      avg(self.posture_hist),
            "avg_stress":       avg(self.stress_hist),
            "peak_stress":      round(max(self.stress_hist, default=0), 1),
            "blinks_per_min":   blink_tracker.blinks_per_minute(),
            "total_blinks":     blink_tracker.total_blinks,
        }


# ─────────────────────────────────────────────────────────────────
#  MAIN LOOP
# ─────────────────────────────────────────────────────────────────

def run():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("ERROR: Cannot open webcam.")
        return None

    timestamp = time.strftime("%Y%m%d_%H%M%S")
    _ensure_output_files_removed()

    fw = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    fh = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 20.0
    if fps == 0 or np.isnan(fps):
        fps = 20.0
    print(f"Webcam {fw}x{fh} @ {fps:.1f}fps  |  Press Q to quit.\n")

    video_writer = cv2.VideoWriter(
        VIDEO_OUTPUT_FILE,
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (fw, fh),
    )
    audio_recorder = AudioRecorder(AUDIO_OUTPUT_FILE)
    audio_started = audio_recorder.start()

    emotion_detector  = EmotionDetector()
    blink_tracker     = BlinkTracker()
    stress_fusion     = StressFusion()
    hand_face_det     = HandFaceDetector()
    stats             = SessionStats()

    gaze_buf    = deque([50.0] * 20, maxlen=20)
    posture_buf = deque([80.0] * 20, maxlen=20)

    frame_idx      = 0
    last_emotion   = "neutral"
    last_probs     = emotion_detector._uniform.copy()
    last_em_stress = 0.0
    last_bbox      = None
    last_face_lm   = None
    posture_issues = []

    data = {
        "emotion":        "neutral",
        "emotion_probs":  emotion_detector._uniform.copy(),
        "emotion_stress": 0.0,
        "gaze_score":     100.0,
        "posture_score":  100.0,
        "blink_stress":   0.0,
        "blink_total":    0,
        "blink_bpm":      0.0,
        "stress_score":   0.0,
        "head_pose":      (0.0, 0.0, 0.0),
        "posture_issues": [],
        "geo_cues":       [],
        "hand_label":     None,
    }

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame     = cv2.flip(frame, 1)
        rgb       = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame_idx += 1

        # ── FACE MESH ─────────────────────────────────────────────
        face_res = face_mesh.process(rgb)
        if face_res.multi_face_landmarks:
            lm          = face_res.multi_face_landmarks[0].landmark
            last_bbox   = face_bbox_from_mesh(lm, fw, fh)
            last_face_lm = lm

            gaze_buf.append(get_gaze_score(lm, fw, fh))
            data["head_pose"] = get_head_pose(lm, fw, fh)

            l_ear = calc_ear(lm, L_EAR_PTS, fw, fh)
            r_ear = calc_ear(lm, R_EAR_PTS, fw, fh)
            blink_tracker.update((l_ear + r_ear) / 2.0)
        else:
            gaze_buf.append(0.0)
            last_face_lm = None

        # ── HANDS ─────────────────────────────────────────────────
        hand_res = hand_detector.process(rgb)
        hand_face_det.analyse(hand_res, last_bbox, fw, fh)

        # Draw hand landmarks (faint)
        if hand_res.multi_hand_landmarks:
            for hlm in hand_res.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    frame, hlm, mp_hands.HAND_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(100, 100, 180), thickness=1, circle_radius=2),
                    mp_drawing.DrawingSpec(color=(80, 80, 150), thickness=1),
                )

        # ── POSE ──────────────────────────────────────────────────
        pose_res = pose_detector.process(rgb)
        if pose_res.pose_landmarks:
            p_score, posture_issues = analyse_posture(pose_res.pose_landmarks, fw, fh)
            posture_buf.append(p_score)
        else:
            posture_buf.append(posture_buf[-1])

        # ── EMOTION (throttled, DeepFace + geometry blend) ────────
        if frame_idx % EMOTION_INTERVAL == 0:
            last_probs, last_emotion = emotion_detector.update(
                frame, last_bbox, last_face_lm)
            last_em_stress = emotion_detector.stress_contribution(last_probs)

        # ── STRESS FUSION ─────────────────────────────────────────
        smooth_gaze    = float(np.mean(gaze_buf))
        smooth_posture = float(np.mean(posture_buf))
        blink_stress   = blink_tracker.stress_contribution()
        stress         = stress_fusion.update(
            last_em_stress, smooth_gaze, smooth_posture,
            blink_stress, hand_face_det.stress_floor)   # <-- hand floor injected here

        data.update({
            "emotion":        last_emotion,
            "emotion_probs":  last_probs,
            "emotion_stress": round(last_em_stress, 1),
            "gaze_score":     round(smooth_gaze, 1),
            "posture_score":  round(smooth_posture, 1),
            "blink_stress":   round(blink_stress, 1),
            "blink_total":    blink_tracker.total_blinks,
            "blink_bpm":      blink_tracker.blinks_per_minute(),
            "stress_score":   stress,
            "posture_issues": posture_issues,
            "geo_cues":       emotion_detector.geometry.active_cues,
            "hand_label":     hand_face_det.active_label,
        })

        stats.push(data)

        # ── DRAW ──────────────────────────────────────────────────
        if pose_res.pose_landmarks:
            mp_drawing.draw_landmarks(
                frame, pose_res.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(70, 70, 70), thickness=1, circle_radius=2),
                mp_drawing.DrawingSpec(color=(50, 50, 50), thickness=1),
            )
        display_frame = draw_hud(frame, data)
        cv2.imshow(WINDOW_NAME, display_frame)
        video_writer.write(frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    video_writer.release()
    audio_saved = audio_recorder.stop() if audio_started else False
    cv2.destroyAllWindows()
    face_mesh.close()
    pose_detector.close()
    hand_detector.close()

    transcript = None
    if audio_saved:
        transcript = transcribe_audio_with_assemblyai(AUDIO_OUTPUT_FILE)
        if transcript:
            print("\n" + "=" * 56)
            print("AssemblyAI transcription:")
            print(transcript)
            print("=" * 56)
        else:
            print("AssemblyAI transcription was not available.")
    else:
        print("Audio transcription skipped because recording was not saved.")

    transcript_text = transcript if transcript else "[transcription unavailable]"
    transcript_path = _save_transcript_file(transcript_text, timestamp)

    report = stats.report(blink_tracker)
    report["video_file"] = VIDEO_OUTPUT_FILE
    report["audio_file"] = AUDIO_OUTPUT_FILE if audio_saved else None
    report["transcript_file"] = transcript_path
    report["transcript_text"] = transcript_text

    report_path = _save_session_report(report, timestamp)
    report["session_report_file"] = report_path
    return report


if __name__ == "__main__":
    result = run()