import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db import Base, engine, SessionLocal
from app.models import Message

app = FastAPI()

# 📌 база
Base.metadata.create_all(bind=engine)

# 📌 пути (чтобы не ловить Render 404)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def home():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

# =========================
# 💬 ЧАТ ЛОГИКА
# =========================

connections = {}

# 📌 список диалогов
@app.get("/dialogs/{username}")
def dialogs(username: str):
    db: Session = SessionLocal()

    msgs = db.query(Message).filter(
        or_(
            Message.sender == username,
            Message.receiver == username
        )
    ).all()

    users = set()

    for m in msgs:
        if m.sender != username:
            users.add(m.sender)
        if m.receiver != username:
            users.add(m.receiver)

    db.close()
    return list(users)

# 📌 websocket
@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()

    username = await websocket.receive_text()
    connections[username] = websocket

    db: Session = SessionLocal()

    try:
        while True:
            data = await websocket.receive_text()

            # 📌 история
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

            # 📌 отправка + сохранение
            elif "|" in data:
                to, msg = data.split("|", 1)

                new_msg = Message(
                    sender=username,
                    receiver=to,
                    content=msg
                )

                db.add(new_msg)
                db.commit()

                # отправка получателю
                if to in connections:
                    await connections[to].send_text(f"{username}|{msg}")

                # себе
                await websocket.send_text(f"{username}|{msg}")

    except WebSocketDisconnect:
        if username in connections:
            del connections[username]
        db.close()
