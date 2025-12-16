import uuid
from enum import Enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
from ..db import Base

class InteractionActionEnum(Enum):
    pass_ = "pass"
    like = "like"
    view = "view"

class UserInteraction(Base):
    __tablename__ = "user_interactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(SQLEnum(InteractionActionEnum, name="interaction_action_enum"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_interactions_user_target", "user_id", "target_user_id"),
        Index("ix_interactions_user_action", "user_id", "action"),
    )

    user = relationship("User", foreign_keys=[user_id], backref="actions_performed")
    target_user = relationship("User", foreign_keys=[target_user_id], backref="actions_received")
