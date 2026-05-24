#! Document routes: upload, list, delete — session-isolated, no authentication required

import os
import uuid
import hashlib
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Header
from sqlalchemy.orm import Session
from fastapi import Depends
from typing import List, Optional

from app.database import get_db
from app.models.document import Document, DocumentStatus
from app.schemas.document import DocumentResponse, DocumentListResponse
from app.core.config import settings
from app.services.rag_service import ingest_document, delete_document_from_index
from app.core.logging import logger

router = APIRouter(prefix="/documents", tags=["Documents"])


def get_user_id(x_session_id: Optional[str] = Header(default="shared")) -> int:
    """Convert session ID string to a stable integer for per-visitor isolation."""
    h = hashlib.md5((x_session_id or "shared").encode()).digest()
    return int.from_bytes(h[:4], "big") % 900000 + 1


def _ingest_in_background(
    document_id: int, file_path: str, file_type: str,
    filename: str, db_url: str, user_id: int
):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    BgSession = sessionmaker(bind=engine)
    bg_db = BgSession()

    doc = bg_db.query(Document).filter(Document.id == document_id).first()
    try:
        chunk_count = ingest_document(user_id, document_id, file_path, file_type, filename)
        if doc:
            doc.status = DocumentStatus.READY
            doc.chunk_count = chunk_count
            bg_db.commit()
            logger.info(f"Document {document_id} ready: {chunk_count} chunks")
    except Exception as e:
        logger.error(f"Ingestion failed for doc {document_id}: {e}")
        if doc:
            doc.status = DocumentStatus.FAILED
            doc.error_message = str(e)[:500]
            bg_db.commit()
    finally:
        bg_db.close()


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_user_id),
):
    suffix = Path(file.filename).suffix.lower()
    if suffix not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported type '{suffix}'.")

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(413, f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit")

    user_dir = settings.upload_path / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    file_path = user_dir / unique_name

    with open(file_path, "wb") as f:
        f.write(content)

    doc = Document(
        user_id=user_id,
        filename=unique_name,
        original_filename=file.filename,
        file_type=suffix.lstrip("."),
        file_size=len(content),
        file_path=str(file_path),
        status=DocumentStatus.PROCESSING,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    background_tasks.add_task(
        _ingest_in_background,
        doc.id, str(file_path), suffix.lstrip("."),
        file.filename, settings.DATABASE_URL, user_id,
    )

    return doc


@router.get("/", response_model=DocumentListResponse)
def list_documents(db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    docs = db.query(Document).filter(
        Document.user_id == user_id
    ).order_by(Document.created_at.desc()).all()
    return DocumentListResponse(documents=docs, total=len(docs))


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    delete_document_from_index(user_id, document_id)
    db.delete(doc)
    db.commit()
