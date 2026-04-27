import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.db import engine, SessionLocal, Base
from app.models import Message

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

Base.metadata.create_all(bind=engine)

connections = {}


@app.get("/")
def home():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


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


@app.get("/history/{u1}/{u2}")
def history(u1: str, u2: str):
    db: Session = SessionLocal()

    msgs = db.query(Message).filter(
        ((Message.sender == u1) & (Message.receiver == u2)) |
        ((Message.sender == u2) & (Message.receiver == u1))
    ).all()

    return [{"sender": m.sender, "content": m.content} for m in msgs]


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


@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
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
