import uuid
from sqlalchemy import Column, String, Index
from sqlalchemy.orm import relationship

from ..db import Base


class Interest(Base):
    __tablename__ = "interests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(120), nullable=False, unique=True)
    group = Column(String(120), nullable=False, server_default="Другое")

    __table_args__ = (
        Index("ix_interests_name", "name"),
        Index("ix_interests_group", "group"),
    )

    user_interests = relationship("UserInterest", back_populates="interest")
