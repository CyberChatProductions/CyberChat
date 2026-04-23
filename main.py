from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

clients = {}

@app.get("/")
def home():
    return FileResponse(os.path.join("templates", "index.html"))

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