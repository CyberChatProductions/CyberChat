import os
import re
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.db import engine, SessionLocal, Base
from app.models import Message, User

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

Base.metadata.create_all(bind=engine)

connections = {}


# ---------------- HTML ----------------
@app.get("/")
def home():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


# ---------------- REG ----------------
def valid_username(name: str):
    return re.match(r"^[A-Za-zА-Яа-я0-9._/]+$", name)


@app.post("/register")
def register(data: dict):
    try:
        username = data.get("username")
        password = data.get("password")

        if not valid_username(username):
            return {"ok": False, "error": "invalid_username"}

        db: Session = SessionLocal()

        exists = db.query(User).filter(User.username == username).first()
        if exists:
            return {"ok": False, "error": "username_taken"}

        user = User(username=username, password=password)
        db.add(user)
        db.commit()

        return {"ok": True}

    except Exception as e:
        return {"ok": False, "error": "fatal_error"}


# ---------------- LOGIN ----------------
@app.post("/login")
def login(data: dict):
    try:
        username = data.get("username")
        password = data.get("password")

        db: Session = SessionLocal()

        user = db.query(User).filter(User.username == username).first()

        if not user:
            return {"ok": False, "error": "no_user"}

        if user.password != password:
            return {"ok": False, "error": "bad_password"}

        return {"ok": True}

    except:
        return {"ok": False, "error": "kubik_broke_it"}


# ---------------- USERS ----------------
@app.get("/users/{username}")
def get_users(username: str):
    db: Session = SessionLocal()

    msgs = db.query(Message).filter(
        (Message.sender == username) | (Message.receiver == username)
    ).all()

    users = set()
    for m in msgs:
        if m.sender != username:
            users.add(m.sender)
        if m.receiver != username:
            users.add(m.receiver)

    return list(users)


# ---------------- HISTORY ----------------
@app.get("/history/{u1}/{u2}")
def history(u1: str, u2: str):
    db: Session = SessionLocal()

    msgs = db.query(Message).filter(
        ((Message.sender == u1) & (Message.receiver == u2)) |
        ((Message.sender == u2) & (Message.receiver == u1))
    ).all()

    return [{"sender": m.sender, "content": m.content} for m in msgs]


# ---------------- ADD CHAT ----------------
@app.post("/add_user")
def add_user(data: dict):
    username = data.get("username")
    target = data.get("target")

    db: Session = SessionLocal()

    exists = db.query(Message).filter(
        ((Message.sender == username) & (Message.receiver == target)) |
        ((Message.sender == target) & (Message.receiver == username))
    ).first()

    if not exists:
        db.add(Message(
            sender=username,
            receiver=target,
            content="👋 chat started"
        ))
        db.commit()

    return {"ok": True}


# ---------------- WS ----------------
@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()

    username = await websocket.receive_text()
    connections[username] = websocket

    db: Session = SessionLocal()

    try:
        while True:
            data = await websocket.receive_text()

            if "|" in data:
                to, msg = data.split("|", 1)

                db.add(Message(
                    sender=username,
                    receiver=to,
                    content=msg
                ))
                db.commit()

                if to in connections:
                    await connections[to].send_text(f"{username}|{msg}")

                await websocket.send_text(f"{username}|{msg}")

    except WebSocketDisconnect:
        connections.pop(username, None)
