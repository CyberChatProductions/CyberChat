from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.db import engine, Base, SessionLocal
from app.models import Message

app = FastAPI()

# 📁 Шаблоны и статика
templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# 🧱 Создание таблиц
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

# 🌐 Главная страница (ВАЖНО: request обязателен)
@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# 🔌 WebSocket подключения
connections = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connections.append(websocket)

    db: Session = SessionLocal()

    try:
        while True:
            data = await websocket.receive_text()

            # 💾 Сохраняем сообщение в БД
            if ":" in data:
                username, content = data.split(":", 1)

                msg = Message(
                    username=username.strip(),
                    content=content.strip()
                )
                db.add(msg)
                db.commit()

            # 📡 Рассылаем всем подключенным
            for conn in connections:
                try:
                    await conn.send_text(data)
                except:
                    pass  # если кто-то отвалился — игнорируем

    except WebSocketDisconnect:
        if websocket in connections:
            connections.remove(websocket)
        db.close()
