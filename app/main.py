import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# 👉 статика (ВАЖНО)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# 👉 главная страница
@app.get("/")
def home():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

# ===== WebSocket =====
connections = {}

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()

    username = await websocket.receive_text()
    connections[username] = websocket

    try:
        while True:
            data = await websocket.receive_text()

            if "|" in data:
                to, msg = data.split("|", 1)

                # отправка получателю
                if to in connections:
                    await connections[to].send_text(f"{username}|{msg}")

                # отправка себе
                await websocket.send_text(f"{username}|{msg}")

    except WebSocketDisconnect:
        if username in connections:
            del connections[username]
