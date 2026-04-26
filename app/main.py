from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db import engine, Base, SessionLocal
from app.models import Message

app = FastAPI()
Base.metadata.create_all(bind=engine)

@app.get("/")
def home():
    return FileResponse("app/static/index.html")

connections = {}  # username -> websocket

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()

    username = await websocket.receive_text()
    connections[username] = websocket

    db: Session = SessionLocal()

    try:
        while True:
            data = await websocket.receive_text()

            # --- ЗАПРОС ИСТОРИИ ---
            if data.startswith("history|"):
                other = data.split("|")[1]

                messages = db.query(Message).filter(
                    ((Message.sender == username) & (Message.receiver == other)) |
                    ((Message.sender == other) & (Message.receiver == username))
                ).all()

                for msg in messages:
                    await websocket.send_text(f"{msg.sender}: {msg.content}")

            # --- ОТПРАВКА СООБЩЕНИЯ ---
            elif "|" in data:
                to, msg = data.split("|", 1)

                # сохраняем
                new_msg = Message(
                    sender=username,
                    receiver=to,
                    content=msg
                )
                db.add(new_msg)
                db.commit()

                # отправляем получателю
                if to in connections:
                    await connections[to].send_text(f"{username}: {msg}")

    except WebSocketDisconnect:
        if username in connections:
            del connections[username]
        db.close()
