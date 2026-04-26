import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db import Base, engine, SessionLocal
from app.models import User, Message

app = FastAPI()

Base.metadata.create_all(bind=engine)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def home():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

# ======================
# USERS
# ======================

def get_or_create_user(db: Session, username: str):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        user = User(username=username)
        db.add(user)
        db.commit()
    return user

@app.get("/users")
def users():
    db = SessionLocal()
    data = db.query(User).all()
    db.close()
    return [u.username for u in data]

# ======================
# CHAT LOGIC
# ======================

connections = {}

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()

    username = await websocket.receive_text()

    db = SessionLocal()
    get_or_create_user(db, username)

    connections[username] = websocket

    try:
        while True:
            data = await websocket.receive_text()

            # 📌 история чата
            if data.startswith("history|"):
                other = data.split("|")[1]

                msgs = db.query(Message).filter(
                    or_(
                        (Message.sender == username) & (Message.receiver == other),
                        (Message.sender == other) & (Message.receiver == username)
                    )
                ).order_by(Message.id).all()

                for m in msgs:
                    await websocket.send_text(f"{m.sender}|{m.content}")

            # 📌 сообщение
            elif "|" in data:
                to, msg = data.split("|", 1)

                get_or_create_user(db, to)

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
