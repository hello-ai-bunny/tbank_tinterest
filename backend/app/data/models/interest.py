import uuid
from sqlalchemy import Column, String, Index
from sqlalchemy.orm import relationship

from ..db import Base


class Interest(Base):
    __tablename__ = 'interests'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(120), nullable=False, unique=True)

    __table_args__ = (
        Index('ix_interests_name', 'name'),
    )

    user_interests = relationship('UserInterest', back_populates='interest')
