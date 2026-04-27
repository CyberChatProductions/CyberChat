from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import os

app = FastAPI()

# ---------------- CORS (на всякий случай) ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DB (Render SAFE) ----------------
DB_PATH = "/tmp/chat.db"
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
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

# ---------------- MODELS ----------------
class Auth(BaseModel):
    username: str
    password: str


# ---------------- AUTH ----------------
@app.post("/register")
def register(data: Auth):
    try:
        cur.execute("INSERT INTO users VALUES (?,?)",
                    (data.username, data.password))
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
def get_users(me: str):
    cur.execute("SELECT username FROM users WHERE username != ?", (me,))
    return [u[0] for u in cur.fetchall()]


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
async def ws_endpoint(ws: WebSocket):
    await ws.accept()

    user = await ws.receive_text()
    connections[user] = ws

    try:
        while True:
            data = await ws.receive_text()
            to, text = data.split("|", 1)

            # save message
            cur.execute(
                "INSERT INTO messages VALUES (?,?,?)",
                (user, to, text)
            )
            conn.commit()

            # send if online
            if to in connections:
                await connections[to].send_text(f"{user}|{text}")

    except WebSocketDisconnect:
        connections.pop(user, None)
