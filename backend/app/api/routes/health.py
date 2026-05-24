#! Health check + visitor counter endpoint

from fastapi import APIRouter
from app.services.llm_service import check_groq_health

router = APIRouter(tags=["Health"])

#! Simple in-memory visitor counter (resets on server restart)
_visitor_count = 0


def increment_visitor():
    global _visitor_count
    _visitor_count += 1


@router.get("/health")
async def health_check():
    groq_ok = await check_groq_health()
    return {
        "status": "healthy",
        "groq": "connected" if groq_ok else "disconnected",
        "visitors": _visitor_count,
    }


@router.post("/visitor")
def track_visitor():
    """Called once when a new browser session starts."""
    global _visitor_count
    _visitor_count += 1
    return {"visitors": _visitor_count}
