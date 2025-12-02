from pydantic import BaseModel, Field


class UserLogin(BaseModel):
    login: str


class Token(BaseModel):
    access_token: str
    token_type: str


class ProfileBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=80)
    city: str | None = None
    about: str | None = Field(None, max_length=500)
    visibility: str | None = "all"
    avatar_url: str | None = None


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=80)
    city: str | None = None
    about: str | None = Field(None, max_length=500)
    visibility: str | None = None
    avatar_url: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    profile: ProfileBase | None = None

    class Config:
        from_attributes = True
