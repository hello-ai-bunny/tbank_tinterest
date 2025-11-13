import uuid
from enum import Enum

from sqlalchemy import (
    Column,
    String,
    Index,
    Enum as SQLEnum,
    CheckConstraint,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from ..db import Base


class ChatType(Enum):
    direct = "direct"


class Chat(Base):
    __tablename__ = "chats"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    direct_a = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    direct_b = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type = Column(
        SQLEnum(ChatType, name="chat_type_enum"),
        nullable=False,
        default=ChatType.direct,
    )

    __table_args__ = (
        Index("uq_chats_direct_pair", "direct_a", "direct_b", unique=True),
        Index("ix_chats_type", "type"),
        CheckConstraint("direct_a <> direct_b", name="chk_chat_not_self"),
    )

    messages = relationship(
        "Message", back_populates="chat", cascade="all, delete-orphan"
    )
