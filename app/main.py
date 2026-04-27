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

    messages = db.query(Message).filter(
        (Message.sender == username) | (Message.receiver == username)
    ).all()

    users = set()
    for m in messages:
        if m.sender != username:
            users.add(m.sender)
        if m.receiver != username:
            users.add(m.receiver)

    return list(users)


@app.get("/history/{user1}/{user2}")
def get_history(user1: str, user2: str):
    db: Session = SessionLocal()

    messages = db.query(Message).filter(
        ((Message.sender == user1) & (Message.receiver == user2)) |
        ((Message.sender == user2) & (Message.receiver == user1))
    ).all()

    return [
        {"sender": m.sender, "content": m.content}
        for m in messages
    ]


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    username = await websocket.receive_text()
    connections[username] = websocket

    db: Session = SessionLocal()

    try:
        while True:
            data = await websocket.receive_text()

            if "|" in data:
                to, msg = data.split("|", 1)

                message = Message(
                    sender=username,
                    receiver=to,
                    content=msg
                )
                db.add(message)
                db.commit()

                if to in connections:
                    await connections[to].send_text(f"{username}|{msg}")

                await websocket.send_text(f"{username}|{msg}")

    except WebSocketDisconnect:
        if username in connections:
            del connections[username]
        db.close()
