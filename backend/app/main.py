#! FastAPI application entry point — no authentication required
#! Run locally: uvicorn app.main:app --reload --port 8000

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import os, shutil

from app.core.config import settings
from app.core.logging import logger
from app.database import create_tables, SessionLocal
from app.models import user, document, chat as chat_model  # noqa: F401


def _seed_shared_user():
    from app.models.user import User
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.id == 1).first():
            db.add(User(id=1))
            db.commit()
    finally:
        db.close()


def _cleanup_old_data(max_age_hours: int = 2):
    """Delete documents and files older than max_age_hours. Runs on startup."""
    from app.models.document import Document
    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)
        old_docs = db.query(Document).filter(Document.created_at < cutoff).all()
        for doc in old_docs:
            try:
                if doc.file_path and os.path.exists(doc.file_path):
                    os.remove(doc.file_path)
            except Exception:
                pass
            db.delete(doc)
        if old_docs:
            db.commit()
            logger.info(f"Cleaned up {len(old_docs)} old documents")

        # Clean up empty user upload dirs
        upload_root = settings.upload_path
        if upload_root.exists():
            for user_dir in upload_root.iterdir():
                if user_dir.is_dir() and not any(user_dir.iterdir()):
                    shutil.rmtree(user_dir, ignore_errors=True)
    except Exception as e:
        logger.warning(f"Cleanup error: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    create_tables()
    _seed_shared_user()
    _cleanup_old_data()
    logger.info("Database ready")
    try:
        from app.services.embedding_service import get_embedding_model
        get_embedding_model()
        logger.info("Embedding model ready")
    except Exception as e:
        logger.warning(f"Could not pre-load embedding model: {e}")
    yield
    logger.info("Shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise RAG Chatbot — LangChain + FAISS + Groq (FREE)",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.routes import documents, chat, health

app.include_router(health.router)
app.include_router(documents.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }
