import datetime
from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    text: str = Field(..., min_length=1, max_length=4096)


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    id: str
    created_at: datetime.datetime
    author_id: str

    class Config:
        from_attributes = True


class ChatParticipant(BaseModel):
    id: str
    first_name: str | None
    last_name: str | None
    avatar_url: str | None

    class Config:
        from_attributes = True


class ChatListItem(BaseModel):
    id: str
    participant: ChatParticipant
    last_message: MessageResponse | None

    class Config:
        from_attributes = True
