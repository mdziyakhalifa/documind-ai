#! Document routes: upload, list, delete — no authentication required

import os
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from fastapi import Depends
from typing import List

from app.database import get_db
from app.models.document import Document, DocumentStatus
from app.schemas.document import DocumentResponse, DocumentListResponse
from app.core.config import settings
from app.services.rag_service import ingest_document, delete_document_from_index
from app.core.logging import logger

router = APIRouter(prefix="/documents", tags=["Documents"])

#! Single shared user ID since there's no authentication
SHARED_USER_ID = 1


def _ingest_in_background(
    document_id: int, file_path: str, file_type: str,
    filename: str, db_url: str
):
    """Background ingestion task — updates document status when done."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    BgSession = sessionmaker(bind=engine)
    bg_db = BgSession()

    doc = bg_db.query(Document).filter(Document.id == document_id).first()
    try:
        chunk_count = ingest_document(SHARED_USER_ID, document_id, file_path, file_type, filename)
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
):
    """Upload a file and kick off background RAG ingestion."""
    #! Validate extension
    suffix = Path(file.filename).suffix.lower()
    if suffix not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            400,
            f"Unsupported type '{suffix}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    #! Check size
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(413, f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit")

    #! Save to disk
    user_dir = settings.upload_path / str(SHARED_USER_ID)
    user_dir.mkdir(parents=True, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    file_path = user_dir / unique_name

    with open(file_path, "wb") as f:
        f.write(content)

    #! Record in DB
    doc = Document(
        user_id=SHARED_USER_ID,
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
        file.filename, settings.DATABASE_URL,
    )

    return doc


@router.get("/", response_model=DocumentListResponse)
def list_documents(db: Session = Depends(get_db)):
    """Return all documents."""
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return DocumentListResponse(documents=docs, total=len(docs))


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Delete document from DB, disk, and FAISS index."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    delete_document_from_index(SHARED_USER_ID, document_id)
    db.delete(doc)
    db.commit()
