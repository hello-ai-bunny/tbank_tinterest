from enum import Enum

from sqlalchemy import ForeignKey, Column, Text, String, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from ..db import Base


class VisibilityEnum(Enum):
    all = "all"
    matched = "matched"
    none = "none"


class Profile(Base):
    __tablename__ = "profile"

    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    full_name = Column(String(120))
    city = Column(String(120))
    about = Column(Text)
    avatar_url = Column(String(500))
    visibility = Column(
        SQLEnum(VisibilityEnum, name="profile_vis_enum"),
        nullable=False,
        default=VisibilityEnum.all,
    )

    __table_args__ = (
        Index("ix_profiles_city", "city"),
        Index("ix_profile_full_name", "full_name"),
    )

    user = relationship("User", back_populates="profile")
