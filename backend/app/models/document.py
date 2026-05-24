#! SQLAlchemy Document model — tracks uploaded files and their processing status

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
import enum
from app.database import Base


class DocumentStatus(str, enum.Enum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)       # pdf, docx, txt, csv, xlsx
    file_size = Column(Float, nullable=False)        # bytes
    file_path = Column(String, nullable=False)       # local disk path

    chunk_count = Column(Integer, default=0)
    status = Column(String, default=DocumentStatus.UPLOADING)
    error_message = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
