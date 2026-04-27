import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.db import engine, SessionLocal, Base
from app.models import Message, User

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
@app.post("/register")
def register(data: dict):
    db = SessionLocal()

    u = data.get("username")
    p = data.get("password")

    if db.query(User).filter(User.username == u).first():
        return {"ok": False}

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


# ---------------- USERS ----------------
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


# ---------------- WEBSOCKET ----------------
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
