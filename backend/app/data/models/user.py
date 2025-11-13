import uuid
from enum import Enum

from sqlalchemy import Column, String, DateTime, Index, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
from ..db import Base


class RoleEnum(Enum):
    user = "user"
    admin = "admin"


class User(Base):
    __tablename__: str = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(320), unique=True, nullable=False)
    pass_hash = Column(String(255), nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    role = Column(
        SQLEnum(RoleEnum, name="role_enum"), nullable=False, default=RoleEnum.user
    )

    __table_args__ = (Index("ix_users_role", "role"),)

    profile = relationship(
        "Profile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    user_interests = relationship(
        "UserInterest", back_populates="user", cascade="all, delete-orphan"
    )
