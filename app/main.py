from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db import engine, Base, SessionLocal
from app.models import Message

app = FastAPI()

# создаём таблицы
Base.metadata.create_all(bind=engine)

# отдаём HTML
@app.get("/")
def home():
    return FileResponse("app/static/index.html")

connections = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connections.append(websocket)

    db: Session = SessionLocal()

    try:
        while True:
            data = await websocket.receive_text()

            if ":" in data:
                username, content = data.split(":", 1)

                msg = Message(
                    username=username.strip(),
                    content=content.strip()
                )
                db.add(msg)
                db.commit()

            for conn in connections:
                try:
                    await conn.send_text(data)
                except:
                    pass

    except WebSocketDisconnect:
        if websocket in connections:
            connections.remove(websocket)
        db.close()
