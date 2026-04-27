import os
import re
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.db import engine, SessionLocal, Base
from app.models import Message, User, Device

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

Base.metadata.create_all(bind=engine)

connections = {}


# ---------------- FRONT ----------------
@app.get("/")
def home():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


# ---------------- AUTH ----------------
def valid_username(name: str):
    return re.match(r"^[A-Za-zА-Яа-я0-9._/]+$", name)


@app.post("/register")
def register(data: dict):
    db = SessionLocal()

    u = data.get("username")
    p = data.get("password")

    if not valid_username(u):
        return {"ok": False, "error": "invalid"}

    if db.query(User).filter(User.username == u).first():
        return {"ok": False, "error": "taken"}

    db.add(User(username=u, password=p))
    db.commit()

    return {"ok": True}


@app.post("/login")
def login(data: dict):
    db = SessionLocal()

    u = data.get("username")
    p = data.get("password")

    user = db.query(User).filter(User.username == u).first()

    if not user or user.password != p:
        return {"ok": False}

    return {"ok": True}


# ---------------- DEVICE SYSTEM ----------------
@app.post("/auto_login")
def auto_login(data: dict):
    db = SessionLocal()

    d = data.get("device_id")

    dev = db.query(Device).filter(Device.device_id == d).first()

    if not dev:
        return {"ok": False}

    return {"ok": True, "username": dev.username}


@app.post("/bind_device")
def bind_device(data: dict):
    db = SessionLocal()

    u = data.get("username")
    d = data.get("device_id")
    ua = data.get("ua")

    exists = db.query(Device).filter(Device.device_id == d).first()

    if not exists:
        db.add(Device(username=u, device_id=d, user_agent=ua))
        db.commit()

    return {"ok": True}


@app.get("/devices/{username}")
def devices(username: str):
    db = SessionLocal()

    return db.query(Device).filter(Device.username == username).all()


@app.post("/remove_device")
def remove_device(data: dict):
    db = SessionLocal()

    d = data.get("device_id")
    p = data.get("password")

    dev = db.query(Device).filter(Device.device_id == d).first()
    user = db.query(User).filter(User.username == dev.username).first()

    if user.password != p:
        return {"ok": False}

    db.delete(dev)
    db.commit()

    return {"ok": True}


# ---------------- USERS / CHAT ----------------
@app.get("/users/{username}")
def users(username: str):
    db = SessionLocal()

    msgs = db.query(Message).filter(
        (Message.sender == username) | (Message.receiver == username)
    ).all()

    out = set()

    for m in msgs:
        if m.sender != username:
            out.add(m.sender)
        if m.receiver != username:
            out.add(m.receiver)

    return list(out)


@app.get("/history/{a}/{b}")
def history(a: str, b: str):
    db = SessionLocal()

    msgs = db.query(Message).filter(
        ((Message.sender == a) & (Message.receiver == b)) |
        ((Message.sender == b) & (Message.receiver == a))
    ).all()

    return [{"sender": m.sender, "content": m.content} for m in msgs]


@app.post("/add_user")
def add_user(data: dict):
    db = SessionLocal()

    u = data.get("username")
    t = data.get("target")

    exists = db.query(Message).filter(
        ((Message.sender == u) & (Message.receiver == t)) |
        ((Message.sender == t) & (Message.receiver == u))
    ).first()

    if not exists:
        db.add(Message(sender=u, receiver=t, content="👋 chat started"))
        db.commit()

    return {"ok": True}


# ---------------- WS ----------------
@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()

    username = await websocket.receive_text()
    connections[username] = websocket

    db = SessionLocal()

    try:
        while True:
            data = await websocket.receive_text()

            if "|" in data:
                to, msg = data.split("|", 1)

                db.add(Message(sender=username, receiver=to, content=msg))
                db.commit()

                if to in connections:
                    await connections[to].send_text(f"{username}|{msg}")

                await websocket.send_text(f"{username}|{msg}")

    except WebSocketDisconnect:
        connections.pop(username, None)
