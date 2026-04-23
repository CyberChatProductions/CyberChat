import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# 🔥 абсолютный путь (ключ к фиксу)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

clients = {}

@app.get("/")
def home():
    return FileResponse(os.path.join(BASE_DIR, "templates", "index.html"))

@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await websocket.accept()
    clients[username] = websocket

    try:
        while True:
            data = await websocket.receive_json()

            msg = {
                "from": username,
                "to": data["to"],
                "text": data["text"]
            }

            if data["to"] in clients:
                await clients[data["to"]].send_json(msg)

            await websocket.send_json(msg)

    except WebSocketDisconnect:
        clients.pop(username, None)