from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# 👉 ВАЖНО: подключаем static
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/")
def home():
    return FileResponse("app/static/index.html")

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

                if to in connections:
                    await connections[to].send_text(f"{username}: {msg}")

    except WebSocketDisconnect:
        if username in connections:
            del connections[username]
