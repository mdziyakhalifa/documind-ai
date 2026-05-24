#! Pydantic schemas for chat sessions and messages

from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Chat"


class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SourceReference(BaseModel):
    document_id: int
    filename: str
    chunk_text: str
    relevance_score: float
    page: Optional[int] = None


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    sources: Optional[List[SourceReference]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    session_id: int
    message: str
    document_ids: Optional[List[int]] = None   #! limit RAG to specific docs


class ChatHistoryResponse(BaseModel):
    session: ChatSessionResponse
    messages: List[ChatMessageResponse]
