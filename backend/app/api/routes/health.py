#! Health check endpoint — used by Render's health check and monitoring

from fastapi import APIRouter
from app.services.llm_service import check_groq_health

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Returns service health including Groq API availability."""
    groq_ok = await check_groq_health()
    return {
        "status": "healthy",
        "groq": "connected" if groq_ok else "disconnected — set GROQ_API_KEY",
    }
