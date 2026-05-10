"""
IntelliHIRE - Video Analysis Module
====================================
Real-time video analysis for interview candidates including:
- Emotion detection (DeepFace + geometry cues)
- Gaze tracking
- Posture analysis
- Blink rate monitoring
- Hand-face gesture detection
- Stress score fusion
"""

import cv2
import numpy as np
import time
import base64
from collections import deque
from typing import Dict, List, Optional, Tuple
import threading

try:
    from mediapipe.python import solutions as mp_solutions
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False


# ─────────────────────────────────────────────────────────────────
#  CONFIG
# ─────────────────────────────────────────────────────────────────

STRESS_WEIGHTS = {
    "emotion": 0.35,
    "gaze": 0.25,
    "posture": 0.20,
    "blink": 0.20,
}

BLINK_WINDOW_SEC = 30
BLINK_NORMAL_BPM = 15.0
BLINK_STRESS_BPM = 30.0
STRESS_EMA_ALPHA = 0.08
EMOTION_INTERVAL = 10
FACE_CROP_PAD = 60
EMOTION_SMOOTH_FRAMES = 12

# Geometry thresholds
SMILE_THRESH = 0.42
COMPRESS_THRESH = 0.28
BROW_COMPRESS_THRESH = 0.040
HAND_LIPS_THRESH = 0.18
HAND_FOREHEAD_THRESH = 0.22
GEOMETRY_BLEND = 0.70
HAND_LIPS_STRESS_FLOOR = 42.0
HAND_FOREHEAD_STRESS_FLOOR = 72.0
EYE_SQUINT_THRESH = 0.20
EAR_THRESH = 0.20
BLINK_CONSEC_FRAMES = 2

EMOTION_STRESS_MAP = {
    "happy": 0.00,
    "neutral": 0.10,
    "surprise": 0.30,
    "sad": 0.50,
    "disgust": 0.60,
    "angry": 0.80,
    "fear": 1.00,
}

ALL_EMOTIONS = ["happy", "neutral", "surprise", "sad", "disgust", "angry", "fear"]

# MediaPipe landmark indices
LIP_LEFT = 61
LIP_RIGHT = 291
LIP_TOP_CENTER = 13
LIP_BOT_CENTER = 14
L_BROW_INNER = 55
R_BROW_INNER = 285
L_BROW_TOP = 52
R_BROW_TOP = 282
FOREHEAD_TOP = 10
NOSE_BRIDGE = 6
FACE_LEFT = 234
FACE_RIGHT = 454
L_EYE_TOP = 159
L_EYE_BOT = 145
L_EYE_LEFT = 33
L_EYE_RIGHT = 133
R_EYE_TOP = 386
R_EYE_BOT = 374
R_EYE_LEFT = 362
R_EYE_RIGHT = 263

# Gaze landmarks
L_IRIS = [474, 475, 476, 477]
R_IRIS = [469, 470, 471, 472]
L_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
R_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]

# Blink EAR landmarks
L_EAR_PTS = [362, 385, 387, 263, 373, 380]
R_EAR_PTS = [33, 160, 158, 133, 153, 144]

# Head pose landmarks
_3D_FACE = np.array([
    (0.0, 0.0, 0.0),
    (0.0, -330.0, -65.0),
    (-225.0, 170.0, -135.0),
    (225.0, 170.0, -135.0),
    (-150.0, -150.0, -125.0),
    (150.0, -150.0, -125.0),
], dtype=np.float64)
_POSE_IDS = [1, 152, 263, 33, 287, 57]


# ─────────────────────────────────────────────────────────────────
#  GEOMETRY CUES ANALYZER
# ─────────────────────────────────────────────────────────────────

class GeometryCues:
    def __init__(self):
        self.active_cues = []
        self.lip_ratio = 0.0
        self.brow_dist = 0.0
        self.lip_openness = 0.0
        self.eye_squint = 0.0

    def analyse(self, landmarks, fw, fh) -> Dict:
        self.active_cues = []

        def px(idx):
            return np.array([landmarks[idx].x * fw, landmarks[idx].y * fh])

        face_w = max(np.linalg.norm(px(FACE_LEFT) - px(FACE_RIGHT)), 1)
        face_h = max(abs(px(FOREHEAD_TOP)[1] - px(NOSE_BRIDGE)[1]) * 3, 1)
        lip_w = np.linalg.norm(px(LIP_LEFT) - px(LIP_RIGHT))
        lip_open = np.linalg.norm(px(LIP_TOP_CENTER) - px(LIP_BOT_CENTER))
        brow_d = np.linalg.norm(px(L_BROW_INNER) - px(R_BROW_INNER))

        l_eye_v = np.linalg.norm(px(L_EYE_TOP) - px(L_EYE_BOT))
        l_eye_h = np.linalg.norm(px(L_EYE_LEFT) - px(L_EYE_RIGHT))
        r_eye_v = np.linalg.norm(px(R_EYE_TOP) - px(R_EYE_BOT))
        r_eye_h = np.linalg.norm(px(R_EYE_LEFT) - px(R_EYE_RIGHT))
        l_ear = l_eye_v / (l_eye_h + 1e-6)
        r_ear = r_eye_v / (r_eye_h + 1e-6)
        avg_ear = (l_ear + r_ear) / 2

        self.lip_ratio = lip_w / face_w
        self.brow_dist = brow_d / face_w
        self.lip_openness = lip_open / face_w
        self.eye_squint = avg_ear

        overrides = {}

        if self.lip_ratio > SMILE_THRESH:
            overrides = {"happy": 0.85, "neutral": 0.10, "surprise": 0.03, "sad": 0.01,
                         "disgust": 0.00, "angry": 0.00, "fear": 0.01}
            self.active_cues.append(f"Smile ({self.lip_ratio:.2f})")

        elif self.lip_ratio < COMPRESS_THRESH and self.lip_openness < 0.04:
            overrides = {"happy": 0.00, "neutral": 0.03, "surprise": 0.03, "sad": 0.50,
                         "disgust": 0.10, "angry": 0.10, "fear": 0.24}
            self.active_cues.append(f"Lip compress ({self.lip_ratio:.2f})")

        if self.brow_dist < BROW_COMPRESS_THRESH and "Smile" not in str(self.active_cues):
            angry_boost = {"happy": 0.00, "neutral": 0.03, "surprise": 0.02, "sad": 0.15,
                           "disgust": 0.15, "angry": 0.65, "fear": 0.00}
            if overrides:
                for e in ALL_EMOTIONS:
                    overrides[e] = (overrides.get(e, 0) + angry_boost.get(e, 0)) / 2
            else:
                overrides = angry_boost
            self.active_cues.append(f"Brow furrow ({self.brow_dist:.3f})")

        if self.eye_squint < EYE_SQUINT_THRESH and "Smile" not in str(self.active_cues):
            squint_boost = {"happy": 0.00, "neutral": 0.02, "surprise": 0.00, "sad": 0.10,
                            "disgust": 0.20, "angry": 0.60, "fear": 0.08}
            if overrides:
                for e in ALL_EMOTIONS:
                    overrides[e] = (overrides.get(e, 0) + squint_boost.get(e, 0)) / 2
            else:
                overrides = squint_boost
            self.active_cues.append(f"Eye squint ({self.eye_squint:.2f})")

        if overrides:
            total = sum(overrides.values()) or 1.0
            overrides = {e: v / total for e, v in overrides.items()}

        return overrides


# ─────────────────────────────────────────────────────────────────
#  HAND-FACE DETECTOR
# ─────────────────────────────────────────────────────────────────

class HandFaceDetector:
    def __init__(self):
        self.active_label = None
        self.stress_floor = 0.0

    def analyse(self, hand_results, face_bbox_xywh, fw, fh):
        self.active_label = None
        self.stress_floor = 0.0

        if not hand_results or not hand_results.multi_hand_landmarks or face_bbox_xywh is None:
            return

        fx, fy, fw_face, fh_face = face_bbox_xywh
        forehead_y_min = fy
        forehead_y_max = fy + fh_face * 0.35
        lips_y_min = fy + fh_face * 0.60
        lips_y_max = fy + fh_face * 0.85

        for hand_lm in hand_results.multi_hand_landmarks:
            for lm in hand_lm.landmark:
                hx = lm.x * fw
                hy = lm.y * fh
                in_face_x = (fx - fh_face * 0.2) < hx < (fx + fw_face + fh_face * 0.2)

                if in_face_x:
                    if forehead_y_min <= hy <= forehead_y_max:
                        self.active_label = "Hand on forehead"
                        self.stress_floor = HAND_FOREHEAD_STRESS_FLOOR
                        return
                    if lips_y_min <= hy <= lips_y_max:
                        if self.stress_floor < HAND_LIPS_STRESS_FLOOR:
                            self.active_label = "Hand on lips"
                            self.stress_floor = HAND_LIPS_STRESS_FLOOR


# ─────────────────────────────────────────────────────────────────
#  BLINK TRACKER
# ─────────────────────────────────────────────────────────────────

class BlinkTracker:
    def __init__(self):
        self.total_blinks = 0
        self._consec = 0
        self._timestamps = deque()

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
#  EMOTION DETECTOR
# ─────────────────────────────────────────────────────────────────

class EmotionDetector:
    def __init__(self):
        self._prob_history = deque(maxlen=EMOTION_SMOOTH_FRAMES)
        self._uniform = {e: 1.0 / len(ALL_EMOTIONS) for e in ALL_EMOTIONS}
        self._prob_history.append(self._uniform.copy())
        self.geometry = GeometryCues()

    def _adaptive_geometry_blend(self, face_bbox_xywh, frame_shape):
        if face_bbox_xywh is None:
            return GEOMETRY_BLEND
        x, y, w, h = face_bbox_xywh
        fh_f, fw_f = frame_shape[:2]
        frame_pixels = fh_f * fw_f
        face_pixels = w * h
        face_coverage = (face_pixels / frame_pixels) * 100 if frame_pixels > 0 else 0
        if face_coverage < 5:
            return 0.25
        elif face_coverage < 15:
            return 0.40
        else:
            return GEOMETRY_BLEND

    def update(self, frame, face_bbox_xywh, face_landmarks) -> Tuple[Dict, str]:
        deepface_probs = None
        if face_bbox_xywh is not None and DEEPFACE_AVAILABLE:
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

        geo_overrides = {}
        if face_landmarks is not None:
            fw_frame = frame.shape[1]
            fh_frame = frame.shape[0]
            if face_bbox_xywh is not None:
                x, y, w, h = face_bbox_xywh
                face_coverage = (w * h) / (fw_frame * fh_frame) * 100
                if face_coverage > 5:
                    geo_overrides = self.geometry.analyse(face_landmarks, fw_frame, fh_frame)
            else:
                geo_overrides = self.geometry.analyse(face_landmarks, fw_frame, fh_frame)

        adaptive_blend = self._adaptive_geometry_blend(face_bbox_xywh, frame.shape)
        if deepface_probs is not None:
            if geo_overrides:
                blended = {e: (1 - adaptive_blend) * deepface_probs.get(e, 0)
                           + adaptive_blend * geo_overrides.get(e, 0) for e in ALL_EMOTIONS}
            else:
                blended = deepface_probs
            self._prob_history.append(blended)
        elif geo_overrides:
            self._prob_history.append(geo_overrides)

        smooth = {e: float(np.mean([p.get(e, 0) for p in self._prob_history])) for e in ALL_EMOTIONS}
        dominant = max(smooth, key=smooth.get)
        return smooth, dominant

    def stress_contribution(self, smooth_probs: dict) -> float:
        score = sum(smooth_probs.get(e, 0) * EMOTION_STRESS_MAP.get(e, 0.2) for e in ALL_EMOTIONS)
        return round(min(score * 100, 100), 1)


# ─────────────────────────────────────────────────────────────────
#  GAZE & HEAD POSE
# ─────────────────────────────────────────────────────────────────

def get_gaze_score(landmarks, fw, fh) -> float:
    def offset(iris_ids, eye_ids):
        iris = np.array([(landmarks[i].x * fw, landmarks[i].y * fh) for i in iris_ids])
        eye = np.array([(landmarks[i].x * fw, landmarks[i].y * fh) for i in eye_ids])
        cx, cy = iris[:, 0].mean(), iris[:, 1].mean()
        ew = max(eye[:, 0].max() - eye[:, 0].min(), 1)
        eh = max(eye[:, 1].max() - eye[:, 1].min(), 1)
        dx = abs((cx - eye[:, 0].min()) / ew - 0.5) * 2
        dy = abs((cy - eye[:, 1].min()) / eh - 0.5) * 2
        return dx, dy
    ldx, ldy = offset(L_IRIS, L_EYE)
    rdx, rdy = offset(R_IRIS, R_EYE)
    return round(max(0.0, 100.0 - ((ldx + rdx + ldy + rdy) / 4) * 200.0), 1)


def get_head_pose(landmarks, fw, fh) -> Tuple[float, float, float]:
    pts2d = np.array([(landmarks[i].x * fw, landmarks[i].y * fh) for i in _POSE_IDS], dtype=np.float64)
    cam = np.array([[fw, 0, fw / 2], [0, fw, fh / 2], [0, 0, 1]], dtype=np.float64)
    ok, rvec, _ = cv2.solvePnP(_3D_FACE, pts2d, cam, np.zeros((4, 1)), flags=cv2.SOLVEPNP_ITERATIVE)
    if not ok:
        return 0.0, 0.0, 0.0
    rmat, _ = cv2.Rodrigues(rvec)
    sy = np.sqrt(rmat[0, 0] ** 2 + rmat[1, 0] ** 2)
    pitch = np.degrees(np.arctan2(-rmat[2, 0], sy))
    yaw = np.degrees(np.arctan2(rmat[1, 0], rmat[0, 0]))
    roll = np.degrees(np.arctan2(rmat[2, 1], rmat[2, 2]))
    return round(pitch, 1), round(yaw, 1), round(roll, 1)


def calc_ear(landmarks, ids, fw, fh) -> float:
    pts = np.array([(landmarks[i].x * fw, landmarks[i].y * fh) for i in ids])
    A = np.linalg.norm(pts[1] - pts[5])
    B = np.linalg.norm(pts[2] - pts[4])
    C = np.linalg.norm(pts[0] - pts[3])
    return (A + B) / (2.0 * C + 1e-6)


def face_bbox_from_mesh(landmarks, fw, fh) -> Tuple[int, int, int, int]:
    xs = [lm.x * fw for lm in landmarks]
    ys = [lm.y * fh for lm in landmarks]
    x, y = int(min(xs)), int(min(ys))
    return x, y, int(max(xs)) - x, int(max(ys)) - y


# ─────────────────────────────────────────────────────────────────
#  POSTURE ANALYSIS
# ─────────────────────────────────────────────────────────────────

def analyse_posture(pose_lm, fw, fh) -> Tuple[float, List[str]]:
    if not MEDIAPIPE_AVAILABLE:
        return 100.0, []

    mp_pose = mp_solutions.pose
    lm = pose_lm.landmark
    issues = []

    def pt(idx):
        return np.array([lm[idx].x * fw, lm[idx].y * fh])

    LS = mp_pose.PoseLandmark.LEFT_SHOULDER.value
    RS = mp_pose.PoseLandmark.RIGHT_SHOULDER.value
    LH = mp_pose.PoseLandmark.LEFT_HIP.value
    RH = mp_pose.PoseLandmark.RIGHT_HIP.value
    NO = mp_pose.PoseLandmark.NOSE.value

    ls, rs = pt(LS), pt(RS)
    lh, rh = pt(LH), pt(RH)
    nose = pt(NO)
    mid_sh = (ls + rs) / 2
    mid_hp = (lh + rh) / 2

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
#  STRESS FUSION
# ─────────────────────────────────────────────────────────────────

class StressFusion:
    def __init__(self):
        self._ema = 10.0

    def update(self, emotion_stress, gaze_score, posture_score, blink_stress, hand_stress_floor: float) -> float:
        raw = (
            STRESS_WEIGHTS["emotion"] * emotion_stress +
            STRESS_WEIGHTS["gaze"] * (100.0 - gaze_score) +
            STRESS_WEIGHTS["posture"] * (100.0 - posture_score) +
            STRESS_WEIGHTS["blink"] * blink_stress
        )
        self._ema = STRESS_EMA_ALPHA * raw + (1 - STRESS_EMA_ALPHA) * self._ema
        result = max(self._ema, hand_stress_floor)
        return round(result, 1)


# ─────────────────────────────────────────────────────────────────
#  VIDEO ANALYZER (Main Class)
# ─────────────────────────────────────────────────────────────────

class VideoAnalyzer:
    """
    Main video analysis class that processes frames and returns real-time metrics.
    """

    def __init__(self):
        self.emotion_detector = EmotionDetector()
        self.blink_tracker = BlinkTracker()
        self.stress_fusion = StressFusion()
        self.hand_face_det = HandFaceDetector()

        self.gaze_buf = deque([50.0] * 20, maxlen=20)
        self.posture_buf = deque([80.0] * 20, maxlen=20)

        self.frame_idx = 0
        self.last_emotion = "neutral"
        self.last_probs = self.emotion_detector._uniform.copy()
        self.last_em_stress = 0.0
        self.last_bbox = None
        self.last_face_lm = None
        self.posture_issues = []

        # MediaPipe detectors
        self.face_mesh = None
        self.pose_detector = None
        self.hand_detector = None

        if MEDIAPIPE_AVAILABLE:
            mp_face_mesh = mp_solutions.face_mesh
            mp_pose = mp_solutions.pose
            mp_hands = mp_solutions.hands

            self.face_mesh = mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.35,
                min_tracking_confidence=0.35,
            )
            self.pose_detector = mp_pose.Pose(
                min_detection_confidence=0.35,
                min_tracking_confidence=0.35,
            )
            self.hand_detector = mp_hands.Hands(
                max_num_hands=2,
                min_detection_confidence=0.35,
                min_tracking_confidence=0.35,
            )

        # Session stats
        self.start_time = time.time()
        self.emotion_probs_hist = []
        self.gaze_hist = []
        self.posture_hist = []
        self.stress_hist = []

    def process_frame(self, frame: np.ndarray) -> Dict:
        """
        Process a single frame and return analysis metrics.
        """
        if not MEDIAPIPE_AVAILABLE:
            return self._get_fallback_metrics()

        fh, fw = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        self.frame_idx += 1

        # Face mesh processing
        face_res = self.face_mesh.process(rgb)
        if face_res.multi_face_landmarks:
            lm = face_res.multi_face_landmarks[0].landmark
            self.last_bbox = face_bbox_from_mesh(lm, fw, fh)
            self.last_face_lm = lm

            self.gaze_buf.append(get_gaze_score(lm, fw, fh))
            head_pose = get_head_pose(lm, fw, fh)

            l_ear = calc_ear(lm, L_EAR_PTS, fw, fh)
            r_ear = calc_ear(lm, R_EAR_PTS, fw, fh)
            self.blink_tracker.update((l_ear + r_ear) / 2.0)
        else:
            self.gaze_buf.append(0.0)
            self.last_face_lm = None
            head_pose = (0.0, 0.0, 0.0)

        # Hand detection
        hand_res = self.hand_detector.process(rgb)
        self.hand_face_det.analyse(hand_res, self.last_bbox, fw, fh)

        # Pose detection
        pose_res = self.pose_detector.process(rgb)
        if pose_res.pose_landmarks:
            p_score, self.posture_issues = analyse_posture(pose_res.pose_landmarks, fw, fh)
            self.posture_buf.append(p_score)
        else:
            self.posture_buf.append(self.posture_buf[-1] if self.posture_buf else 80.0)

        # Emotion detection (throttled)
        if self.frame_idx % EMOTION_INTERVAL == 0:
            self.last_probs, self.last_emotion = self.emotion_detector.update(
                frame, self.last_bbox, self.last_face_lm)
            self.last_em_stress = self.emotion_detector.stress_contribution(self.last_probs)

        # Stress fusion
        smooth_gaze = float(np.mean(self.gaze_buf))
        smooth_posture = float(np.mean(self.posture_buf))
        blink_stress = self.blink_tracker.stress_contribution()
        stress = self.stress_fusion.update(
            self.last_em_stress, smooth_gaze, smooth_posture,
            blink_stress, self.hand_face_det.stress_floor)

        metrics = {
            "emotion": self.last_emotion,
            "emotion_probs": self.last_probs,
            "emotion_stress": round(self.last_em_stress, 1),
            "gaze_score": round(smooth_gaze, 1),
            "posture_score": round(smooth_posture, 1),
            "blink_stress": round(blink_stress, 1),
            "blink_total": self.blink_tracker.total_blinks,
            "blink_bpm": self.blink_tracker.blinks_per_minute(),
            "stress_score": stress,
            "head_pose": head_pose,
            "posture_issues": self.posture_issues,
            "geo_cues": self.emotion_detector.geometry.active_cues,
            "hand_label": self.hand_face_det.active_label,
            "face_detected": self.last_bbox is not None,
        }

        # Store for session stats
        self.emotion_probs_hist.append(self.last_probs)
        self.gaze_hist.append(smooth_gaze)
        self.posture_hist.append(smooth_posture)
        self.stress_hist.append(stress)

        return metrics

    def _get_fallback_metrics(self) -> Dict:
        return {
            "emotion": "neutral",
            "emotion_probs": {e: 1.0 / 7 for e in ALL_EMOTIONS},
            "emotion_stress": 0.0,
            "gaze_score": 50.0,
            "posture_score": 50.0,
            "blink_stress": 0.0,
            "blink_total": 0,
            "blink_bpm": 0.0,
            "stress_score": 25.0,
            "head_pose": (0.0, 0.0, 0.0),
            "posture_issues": [],
            "geo_cues": [],
            "hand_label": None,
            "face_detected": False,
        }

    def get_session_report(self) -> Dict:
        """Get comprehensive session analysis report."""
        duration = time.time() - self.start_time
        avg = lambda lst: round(float(np.mean(lst)), 1) if lst else 0.0

        avg_emotion_probs = {}
        if self.emotion_probs_hist:
            for em in ALL_EMOTIONS:
                avg_emotion_probs[em] = np.mean([p.get(em, 0) for p in self.emotion_probs_hist])

        top_3 = sorted(avg_emotion_probs.items(), key=lambda x: x[1], reverse=True)[:3] if avg_emotion_probs else []
        dominant = top_3[0][0] if top_3 else "neutral"

        return {
            "duration_sec": round(duration, 1),
            "frames_analyzed": self.frame_idx,
            "dominant_emotion": dominant,
            "top_3_emotions": [(em, round(prob * 100, 1)) for em, prob in top_3],
            "avg_gaze": avg(self.gaze_hist),
            "avg_posture": avg(self.posture_hist),
            "avg_stress": avg(self.stress_hist),
            "peak_stress": round(max(self.stress_hist, default=0), 1),
            "blinks_per_min": self.blink_tracker.blinks_per_minute(),
            "total_blinks": self.blink_tracker.total_blinks,
        }

    def cleanup(self):
        """Release MediaPipe resources."""
        if self.face_mesh:
            self.face_mesh.close()
        if self.pose_detector:
            self.pose_detector.close()
        if self.hand_detector:
            self.hand_detector.close()


# Session-level storage for analyzers
_session_analyzers: Dict[str, VideoAnalyzer] = {}


def get_analyzer(session_id: str) -> VideoAnalyzer:
    """Get or create a video analyzer for a session."""
    if session_id not in _session_analyzers:
        _session_analyzers[session_id] = VideoAnalyzer()
    return _session_analyzers[session_id]


def clear_analyzer(session_id: str) -> Optional[Dict]:
    """Clear analyzer for a session and return final report."""
    if session_id in _session_analyzers:
        analyzer = _session_analyzers[session_id]
        report = analyzer.get_session_report()
        analyzer.cleanup()
        del _session_analyzers[session_id]
        return report
    return None


def process_video_frame(session_id: str, frame_data: bytes) -> Dict:
    """
    Process a video frame from base64 data.
    Returns analysis metrics.
    """
    try:
        # Decode base64 frame
        nparr = np.frombuffer(base64.b64decode(frame_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return {"error": "Failed to decode frame"}

        analyzer = get_analyzer(session_id)
        metrics = analyzer.process_frame(frame)
        return metrics
    except Exception as e:
        return {"error": str(e)}
