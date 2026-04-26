from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db import engine, Base, SessionLocal
from app.models import Message

app = FastAPI()
Base.metadata.create_all(bind=engine)

@app.get("/")
def home():
    return FileResponse("app/static/index.html")

# 🔥 список диалогов
@app.get("/dialogs/{username}")
def get_dialogs(username: str):
    db: Session = SessionLocal()

    msgs = db.query(Message).filter(
        or_(Message.sender == username, Message.receiver == username)
    ).all()

    users = set()
    for m in msgs:
        if m.sender != username:
            users.add(m.sender)
        if m.receiver != username:
            users.add(m.receiver)

    db.close()
    return JSONResponse(list(users))

connections = {}

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()

    username = await websocket.receive_text()
    connections[username] = websocket

    db: Session = SessionLocal()

    try:
        while True:
            data = await websocket.receive_text()

            # 🔥 история
            if data.startswith("history|"):
                other = data.split("|")[1]

                messages = db.query(Message).filter(
                    ((Message.sender == username) & (Message.receiver == other)) |
                    ((Message.sender == other) & (Message.receiver == username))
                ).all()

                for msg in messages:
                    await websocket.send_text(
                        f"{msg.sender}|{msg.content}"
                    )

            # 🔥 отправка
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
                    await connections[to].send_text(
                        f"{username}|{msg}"
                    )

                # и себе тоже (чтобы одинаковый формат)
                await websocket.send_text(
                    f"{username}|{msg}"
                )

    except WebSocketDisconnect:
        if username in connections:
            del connections[username]
        db.close()
