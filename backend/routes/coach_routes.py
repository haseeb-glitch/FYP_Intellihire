from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from backend.routes.auth import get_current_user
from backend.config import Config
import os

coach_router = APIRouter()

COACH_SYSTEM_PROMPT = """You are IntelliCoach, an expert AI interview coach built into IntelliHire — an AI-powered mock interview preparation platform.

About IntelliHire:
- Conducts mock HR, Technical, and Stress interviews with AI agents
- HR Agent evaluates communication, STAR method, clarity, professionalism
- Technical Agent evaluates correctness, depth, efficiency, problem-solving
- Stress Agent evaluates composure, confidence, pressure handling
- Provides detailed score reports, radar charts, and performance analytics
- Offers a personalized Career Roadmap based on interview results
- Supports text, audio, and video interview modes
- Adaptive difficulty system that adjusts question difficulty based on performance

Your role as IntelliCoach:
- Answer questions about IntelliHire features directly and clearly
- Give candidates practical, specific, actionable tips to improve interview performance
- Help with STAR method, LeetCode prep, system design, behavioral questions, confidence building
- Be encouraging but honest — point out real areas for improvement
- Keep responses focused and conversational — under 120 words unless detailed explanation is needed
- Never make up statistics; give real, proven interview advice
- If asked about scores or reports, ask the candidate to share their scores so you can give specific feedback
"""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


@coach_router.post("/chat")
async def coach_chat(request: ChatRequest, current_user=Depends(get_current_user)):
    try:
        from groq import Groq
        api_key = Config.GROQ_API_KEY or os.environ.get("GROQ_API_KEY")
        if not api_key:
            return {"response": "AI Coach is currently unavailable. Please ensure the API key is configured."}

        client = Groq(api_key=api_key)

        messages = [{"role": "system", "content": COACH_SYSTEM_PROMPT}]
        for msg in request.messages[-12:]:
            if msg.role in ("user", "assistant"):
                messages.append({"role": msg.role, "content": msg.content})

        response = client.chat.completions.create(
            messages=messages,
            model=Config.GROQ_MODEL or "llama-3.1-8b-instant",
            temperature=0.75,
            max_tokens=350,
            stream=False,
        )

        content = response.choices[0].message.content or ""
        return {"response": content.strip()}

    except Exception as e:
        print(f"Coach chat error: {e}")
        return {"response": "I'm having a bit of trouble right now. Please try again in a moment!"}
