import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..db import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    text = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    edited_at = Column(DateTime(timezone=True))
    deleted_at = Column(DateTime(timezone=True))

    chat_id = Column(
        String(36), ForeignKey("chats.id", ondelete="CASCADE"), nullable=False
    )
    author_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    __table_args__ = (
        Index("ix_messages_chat_created", "chat_id", "created_at"),
        Index("ix_messages_author", "author_id"),
    )

    chat = relationship("Chat", back_populates="messages")
