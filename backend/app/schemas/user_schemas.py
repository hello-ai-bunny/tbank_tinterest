from pydantic import BaseModel


class UserLogin(BaseModel):
    login: str


class Token(BaseModel):
    access_token: str
    token_type: str


class ProfileBase(BaseModel):
    full_name: str | None = None
    city: str | None = None
    about: str | None = None
    visibility: str | None = "all"
    avatar_url: str | None = None


class ProfileUpdate(ProfileBase):
    avatar_url: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    profile: ProfileBase | None = None

    class Config:
        from_attributes = True
