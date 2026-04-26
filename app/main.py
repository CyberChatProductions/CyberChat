from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse

app = FastAPI()

@app.get("/")
def home():
    return FileResponse("app/static/index.html")

connections = {}  # username -> websocket

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()

    username = await websocket.receive_text()
    connections[username] = websocket

    try:
        while True:
            data = await websocket.receive_text()

            # формат: "to|message"
            if "|" in data:
                to, msg = data.split("|", 1)

                if to in connections:
                    await connections[to].send_text(f"{username}: {msg}")

    except WebSocketDisconnect:
        if username in connections:
            del connections[username]
