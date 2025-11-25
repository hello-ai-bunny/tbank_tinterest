from pydantic import BaseModel


class InterestBase(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True

class InterestList(BaseException):
    interests: list[InterestBase]