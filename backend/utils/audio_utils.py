import os
from backend.config import Config

def save_audio_content(content, session_id, question_id):
    """
    Saves raw binary audio content to the session's upload directory.
    """
    session_dir = os.path.join(Config.UPLOAD_FOLDER, str(session_id))
    if not os.path.exists(session_dir):
        os.makedirs(session_dir)

    file_path = os.path.join(session_dir, f"audio_{question_id}.webm")
    with open(file_path, 'wb') as f:
        f.write(content)
    return file_path

def save_audio_file(file_obj, session_id, question_id):
    """
    Saves an uploaded audio file (Flask or FastAPI) to the session's upload directory.
    """
    session_dir = os.path.join(Config.UPLOAD_FOLDER, str(session_id))
    if not os.path.exists(session_dir):
        os.makedirs(session_dir)

    file_path = os.path.join(session_dir, f"audio_{question_id}.webm")
    
    if hasattr(file_obj, 'save'): # Flask
        file_obj.save(file_path)
    elif hasattr(file_obj, 'read'): # Generic/FastAPI
        with open(file_path, 'wb') as f:
            f.write(file_obj.read())
            
    return file_path
