from sqlalchemy import Column, Integer, String
from app.db import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    sender = Column(String)
    receiver = Column(String)
    content = Column(String)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    password = Column(String)


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True)
    username = Column(String)
    device_id = Column(String, unique=True)
    user_agent = Column(String)
