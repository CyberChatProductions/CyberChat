import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# статика
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# -------- ГЛАВНАЯ --------
@app.get("/")
def home():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


# -------- WEBSOCKET --------
connections = {}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WS CONNECTED")

    username = await websocket.receive_text()
    connections[username] = websocket

    try:
        while True:
            data = await websocket.receive_text()
            print("RECV:", data)

            if "|" in data:
                to, msg = data.split("|", 1)

                if to in connections:
                    await connections[to].send_text(f"{username}|{msg}")

                await websocket.send_text(f"{username}|{msg}")

    except WebSocketDisconnect:
        print("WS DISCONNECTED")
        if username in connections:
            del connections[username]
