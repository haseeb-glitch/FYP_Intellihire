import os
import assemblyai as aai
from dotenv import load_dotenv

from backend.config import Config

FILLER_WORDS = [
    "um", "umm", "uh", "uhh", "er", "erm", "ah", "aah", "aaah",
    "hmm", "mhm", "mm", "like", "you know", "i mean",
]


def _load_project_env():
    env_path = os.path.join(os.path.dirname(Config.BASE_DIR), ".env")
    load_dotenv(env_path)
    load_dotenv()


def build_transcription_config(**overrides):
    options = {
        "disfluencies": True,
        "format_text": False,
        "word_boost": FILLER_WORDS,
        "boost_param": aai.WordBoost.high,
    }
    options.update(overrides)
    return aai.TranscriptionConfig(**options)

def transcribe(audio_path):
    """
    Transcribes the given audio file using AssemblyAI API.
    """
    _load_project_env()
    api_key = os.environ.get("ASSEMBLYAI_API_KEY")
    if not api_key:
        return {"text": "", "error": "AssemblyAI API Key not found"}

    if not os.path.exists(audio_path):
        return {
            "text": "",
            "language": "en",
            "error": f"Audio file not found at: {audio_path}"
        }

    try:
        aai.settings.api_key = api_key
        transcriber = aai.Transcriber()
        config = build_transcription_config()
        transcript = transcriber.transcribe(audio_path, config)
        
        if transcript.status == aai.TranscriptStatus.error:
            raise Exception(transcript.error)

        text = (transcript.text or "").strip()
        return {
            "text": text,
            "language": "en",
            "confidence": transcript.confidence,
            "error": None if text else "No speech detected in the recorded audio"
        }
    except Exception as e:
        print(f"AssemblyAI Transcription Error: {e}")
        return {
            "text": "",
            "language": "en",
            "error": str(e)
        }