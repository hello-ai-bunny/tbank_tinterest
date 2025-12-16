from pydantic import BaseModel, Field
from .survey_schemas import InterestBase


class UserLogin(BaseModel):
    login: str


class Token(BaseModel):
    access_token: str
    token_type: str


class ProfileBase(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=40)
    last_name: str | None = Field(None, min_length=1, max_length=40)
    email: str | None = None
    telegram: str | None = None
    city: str | None = None
    about: str | None = Field(None, max_length=500)
    visibility: str | None = "all"
    avatar_url: str | None = None


class ProfileUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=40)
    last_name: str | None = Field(None, min_length=1, max_length=40)
    email: str | None = None
    telegram: str | None = None
    city: str | None = None
    about: str | None = Field(None, max_length=500)
    visibility: str | None = None
    avatar_url: str | None = None




class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    profile: ProfileBase | None = None
    interests: list[InterestBase] = []

    class Config:
        from_attributes = True


class UserRecommendationResponse(UserResponse):
    compatibility: int = 0
