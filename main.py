from fastapi import FastAPI, WebSocket, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

app = FastAPI()

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

clients = {}  # username -> websocket


@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.websocket("/ws/{username}")
async def ws(websocket: WebSocket, username: str):
    await websocket.accept()
    clients[username] = websocket

    # отправляем список пользователей всем
    await broadcast_users()

    try:
        while True:
            data = await websocket.receive_json()

            msg_type = data["type"]

            # 💬 сообщение
            if msg_type == "message":
                to = data["to"]
                text = data["text"]

                message = {
                    "type": "message",
                    "from": username,
                    "to": to,
                    "text": text
                }

                # личка
                if to in clients:
                    await clients[to].send_json(message)

                # себе тоже
                await websocket.send_json(message)

            # 🔄 запрос пользователей
            elif msg_type == "get_users":
                await broadcast_users()

    except:
        if username in clients:
            del clients[username]
        await broadcast_users()


async def broadcast_users():
    users = list(clients.keys())

    for ws in clients.values():
        await ws.send_json({
            "type": "users",
            "users": users
        })