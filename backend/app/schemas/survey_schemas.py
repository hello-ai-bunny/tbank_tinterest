from pydantic import BaseModel


class InterestBase(BaseModel):
    id: str
    name: str
    group: str

    class Config:
        from_attributes = True


class InterestList(BaseModel):
    interests: list[InterestBase]
