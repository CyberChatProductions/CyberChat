from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
from pydantic import BaseModel
import sqlite3

app = FastAPI()

templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# ---------------- DB ----------------
conn = sqlite3.connect("chat.db", check_same_thread=False)
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT
)
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS messages (
    sender TEXT,
    receiver TEXT,
    content TEXT
)
""")

conn.commit()

# ---------------- AUTH ----------------
class Auth(BaseModel):
    username: str
    password: str


@app.post("/register")
def register(data: Auth):
    try:
        cur.execute("INSERT INTO users VALUES (?,?)", (data.username, data.password))
        conn.commit()
        return {"ok": True}
    except:
        return {"ok": False}


@app.post("/login")
def login(data: Auth):
    cur.execute("SELECT * FROM users WHERE username=? AND password=?",
                (data.username, data.password))
    return {"ok": cur.fetchone() is not None}


# ---------------- USERS ----------------
@app.get("/users/{me}")
def users(me: str):
    cur.execute("SELECT username FROM users WHERE username != ?", (me,))
    return [x[0] for x in cur.fetchall()]


# ---------------- HISTORY ----------------
@app.get("/history/{me}/{other}")
def history(me: str, other: str):
    cur.execute("""
        SELECT sender, content FROM messages
        WHERE (sender=? AND receiver=?)
        OR (sender=? AND receiver=?)
        ORDER BY rowid
    """, (me, other, other, me))

    return [{"sender": r[0], "content": r[1]} for r in cur.fetchall()]


# ---------------- WS ----------------
connections = {}

@app.websocket("/ws")
async def ws(ws: WebSocket):
    await ws.accept()

    user = await ws.receive_text()
    connections[user] = ws

    try:
        while True:
            data = await ws.receive_text()
            to, text = data.split("|", 1)

            # save
            cur.execute("INSERT INTO messages VALUES (?,?,?)",
                        (user, to, text))
            conn.commit()

            # send to receiver
            if to in connections:
                await connections[to].send_text(f"{user}|{text}")

    except WebSocketDisconnect:
        connections.pop(user, None)
