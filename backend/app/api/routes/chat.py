#! Chat routes: sessions, history, SSE streaming — session-isolated, no auth required

import json
import hashlib
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import (
    ChatSessionCreate, ChatSessionResponse,
    ChatRequest, ChatHistoryResponse,
)
from app.services.rag_service import query_rag
from app.core.logging import logger

router = APIRouter(prefix="/chat", tags=["Chat"])


def get_user_id(x_session_id: Optional[str] = Header(default="shared")) -> int:
    """Convert session ID string to a stable integer for per-visitor isolation."""
    h = hashlib.md5((x_session_id or "shared").encode()).digest()
    return int.from_bytes(h[:4], "big") % 900000 + 1


@router.post("/sessions", response_model=ChatSessionResponse, status_code=201)
def create_session(data: ChatSessionCreate, db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    session = ChatSession(user_id=user_id, title=data.title or "New Chat")
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions", response_model=List[ChatSessionResponse])
def list_sessions(db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .limit(50)
        .all()
    )


@router.get("/sessions/{session_id}", response_model=ChatHistoryResponse)
def get_session(session_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id, ChatSession.user_id == user_id
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return ChatHistoryResponse(session=session, messages=messages)


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(session_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id, ChatSession.user_id == user_id
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    db.delete(session)
    db.commit()


@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
def rename_session(session_id: int, data: ChatSessionCreate, db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id, ChatSession.user_id == user_id
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    session.title = data.title
    db.commit()
    db.refresh(session)
    return session


@router.post("/stream")
async def chat_stream(request: ChatRequest, db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    session = db.query(ChatSession).filter(
        ChatSession.id == request.session_id, ChatSession.user_id == user_id
    ).first()
    if not session:
        raise HTTPException(404, "Chat session not found")

    user_msg = ChatMessage(session_id=request.session_id, role="user", content=request.message)
    db.add(user_msg)
    db.commit()

    if session.title == "New Chat":
        session.title = request.message[:60]
        db.commit()

    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == request.session_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(12)
        .all()
    )
    chat_history = [{"role": m.role, "content": m.content} for m in history]

    async def event_generator():
        full_response = []
        final_sources = []
        sources_sent = False

        try:
            async for token, sources in query_rag(
                user_id=user_id,
                query=request.message,
                chat_history=chat_history,
                document_ids=request.document_ids,
            ):
                if not sources_sent:
                    final_sources = sources
                    if sources:
                        sources_data = [
                            {
                                "document_id": s.get("document_id"),
                                "filename": s.get("filename"),
                                "chunk_text": s.get("chunk_text", "")[:400],
                                "relevance_score": round(s.get("relevance_score", 0), 3),
                                "page": s.get("page"),
                            }
                            for s in sources
                        ]
                        yield f"event: sources\ndata: {json.dumps(sources_data)}\n\n"
                    sources_sent = True

                full_response.append(token)
                yield f"event: token\ndata: {json.dumps(token)}\n\n"

        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield f"event: error\ndata: {json.dumps(str(e))}\n\n"
            return

        complete = "".join(full_response)
        sources_db = [
            {
                "document_id": s.get("document_id"),
                "filename": s.get("filename"),
                "chunk_text": s.get("chunk_text", "")[:500],
                "relevance_score": round(s.get("relevance_score", 0), 3),
                "page": s.get("page"),
            }
            for s in final_sources
        ]
        assistant_msg = ChatMessage(
            session_id=request.session_id,
            role="assistant",
            content=complete,
            sources=sources_db or None,
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        yield f"event: done\ndata: {json.dumps({'message_id': assistant_msg.id})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
