#! Configuration management for the entire application
#! All environment variables are loaded here via pydantic-settings

from pydantic_settings import BaseSettings
from pydantic import field_validator
from pathlib import Path
from typing import List
import json


class Settings(BaseSettings):
    # ─── App Info ──────────────────────────────────────────────────────────────
    APP_NAME: str = "DocuMind AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # ─── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./documind.db"

    # ─── File Storage ──────────────────────────────────────────────────────────
    UPLOAD_DIR: str = "uploads"
    VECTOR_STORE_DIR: str = "vector_stores"
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt", ".csv", ".xlsx"]

    # ─── Embeddings ───────────────────────────────────────────────────────────
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384

    # ─── Groq LLM ─────────────────────────────────────────────────────────────
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_MAX_TOKENS: int = 2048

    # ─── RAG Pipeline ──────────────────────────────────────────────────────────
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K_RESULTS: int = 5
    SIMILARITY_THRESHOLD: float = 0.1

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS — accepts plain URL, comma-separated, or JSON array."""
        v = self.ALLOWED_ORIGINS.strip()
        try:
            parsed = json.loads(v)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
        return [o.strip() for o in v.split(",") if o.strip()]

    @property
    def upload_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def vector_store_path(self) -> Path:
        path = Path(self.VECTOR_STORE_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def is_postgres(self) -> bool:
        return self.DATABASE_URL.startswith("postgresql")


#! Single global instance used throughout the app
settings = Settings()
