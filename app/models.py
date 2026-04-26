from sqlalchemy import Column, Integer, String, Text
from app.db import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    sender = Column(String)
    receiver = Column(String)
    content = Column(Text)
