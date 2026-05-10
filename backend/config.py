import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # API Keys
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    SERPAPI_KEY = os.getenv('SERPAPI_KEY')
    JUDGE0_API_KEY = os.getenv('JUDGE0_API_KEY')
    
    # Security
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'intellihire-secret')
    
    # Email / SMTP settings for OTP
    EMAIL_HOST = os.getenv('EMAIL_HOST')
    EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
    EMAIL_USER = os.getenv('EMAIL_USER')
    EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')
    EMAIL_FROM = os.getenv('EMAIL_FROM', os.getenv('EMAIL_USER'))
    EMAIL_FROM_NAME = os.getenv('EMAIL_FROM_NAME', 'IntelliHire')
    EMAIL_REPLY_TO = os.getenv('EMAIL_REPLY_TO', EMAIL_FROM)
    EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'true').lower() == 'true'
    
    # Database
    MONGODB_SETTINGS = {
        'host': os.getenv('MONGO_URI', 'mongodb://localhost:27017/intellihire')
    }
    
    # AI Models Config
    USE_OLLAMA = os.getenv('USE_OLLAMA', 'false').lower() == 'true'
    OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.1')
    GROQ_MODEL = os.getenv('GROQ_MODEL', 'llama-3.1-8b-instant')
    
    # File Paths
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    UPLOAD_FOLDER = os.path.join(os.path.dirname(BASE_DIR), 'uploads')
    QUESTION_BANKS_DIR = os.path.join(BASE_DIR, 'question_banks')
    RUBRICS_DIR = os.path.join(BASE_DIR, 'rubrics')
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB
    
    # Flask Env
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')