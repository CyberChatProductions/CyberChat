from sqlalchemy import Column, Integer, String, Text
from app.db import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    content = Column(Text)