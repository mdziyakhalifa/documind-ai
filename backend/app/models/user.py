#! Minimal User model — exists solely to satisfy the FK constraint on
#! documents.user_id and chat_sessions.user_id.
#! The app uses a single SHARED_USER_ID=1 (no authentication).

from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
