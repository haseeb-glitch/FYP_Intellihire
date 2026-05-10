from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mongoengine as db
from dotenv import load_dotenv
load_dotenv()
from backend.config import Config
import os

# Initialize FastAPI app
app = FastAPI(title="IntelliHire API", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB on startup
@app.on_event("startup")
async def startup_event():
    db.connect(host=Config.MONGODB_SETTINGS['host'])
    print(f"Connected to MongoDB at {Config.MONGODB_SETTINGS['host']}")

# Root/Test route
@app.get("/api/test")
async def test_backend():
    return {"status": "Backend Working (FastAPI)"}

# Register routers
from backend.routes.auth import auth_router
from backend.routes.interview_routes import interview_router
from backend.routes.report_routes import report_router
from backend.routes.admin_routes import admin_router
from backend.routes.personalized_routes import personalized_router
from backend.routes.video_routes import video_router
from backend.routes.coach_routes import coach_router

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(interview_router, prefix="/api/interview", tags=["Interview"])
app.include_router(report_router, prefix="/api/report", tags=["Reports"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(personalized_router, prefix="/api/personalized", tags=["Personalized"])
app.include_router(video_router, prefix="/api/video", tags=["Video Analysis"])
app.include_router(coach_router, prefix="/api/coach", tags=["AI Coach"])

