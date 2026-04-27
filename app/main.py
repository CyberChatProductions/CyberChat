import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# если используешь шаблоны
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# статика
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")


# -------- ГЛАВНАЯ --------
@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


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

            elif data.startswith("history|"):
                await websocket.send_text("system|history")

    except WebSocketDisconnect:
        print("WS DISCONNECTED")
        if username in connections:
            del connections[username]
