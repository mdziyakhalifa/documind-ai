#! FastAPI application entry point — no authentication required
#! Run locally: uvicorn app.main:app --reload --port 8000

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging import logger
from app.database import create_tables, SessionLocal
# Import all models so SQLAlchemy registers them before create_all()
from app.models import user, document, chat as chat_model  # noqa: F401


def _seed_shared_user():
    """Ensure the SHARED_USER_ID=1 row exists so FK constraints are satisfied."""
    from app.models.user import User
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.id == 1).first():
            db.add(User(id=1))
            db.commit()
            logger.info("Shared user (id=1) created")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    create_tables()
    _seed_shared_user()
    logger.info("Database ready")
    #! Embedding model loads on first upload request (lazy) to save RAM on free tier
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
    allow_origins=settings.ALLOWED_ORIGINS,
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
