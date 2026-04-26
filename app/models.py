from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, index=True)

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    sender = Column(String, index=True)
    receiver = Column(String, index=True)
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
