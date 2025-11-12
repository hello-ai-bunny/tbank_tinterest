from sqlalchemy import Column, String, ForeignKey, Index
from sqlalchemy.orm import relationship

from ..db import Base

class UserInterest(Base):
    __tablename__ = 'user_interests'

    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    interest_id = Column(String(36), ForeignKey('interests.id', ondelete='CASCADE'), primary_key=True)

    __table_args__ = (
        Index('ix_user_interests_interest_user', "interest_id", "user_id"),
    )

    user = relationship("User", back_populates="user_interests")
    interest = relationship("Interest", back_populates="user_interests")