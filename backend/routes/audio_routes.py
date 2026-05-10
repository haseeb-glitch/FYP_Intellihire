from flask import Blueprint, request, jsonify
import os
from backend.routes.auth import token_required
from backend.agents.audio import transcription, speech_analysis
from backend.utils import audio_utils

audio_bp = Blueprint('audio', __name__)

@audio_bp.route('/transcribe', methods=['POST'])
@token_required
def transcribe_audio(current_user):
    if 'audio' not in request.files:
        return jsonify({"message": "No audio file"}), 400
        
    audio_file = audio_file = request.files['audio']
    # Save temporarily for processing
    temp_path = os.path.join("uploads", "temp_transcribe.webm")
    if not os.path.exists("uploads"): os.makedirs("uploads")
    audio_file.save(temp_path)
    
    result = transcription.transcribe(temp_path)
    return jsonify(result)

@audio_bp.route('/analyze', methods=['POST'])
def analyze_speech():
    if 'audio' not in request.files:
        return jsonify({"message": "No audio file"}), 400
        
    audio_file = request.files['audio']
    temp_path = os.path.join("uploads", "temp_analyze.wav")
    audio_file.save(temp_path)
    
    result = speech_analysis.analyze(temp_path)
    return jsonify(result)
