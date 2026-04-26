from pydantic import BaseModel

class MessageCreate(BaseModel):
    username: str
    content: str

class MessageResponse(BaseModel):
    id: int
    username: str
    content: str

    class Config:
        from_attributes = True