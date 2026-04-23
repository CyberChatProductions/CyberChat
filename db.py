import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "chat.db")

conn = sqlite3.connect(DB_PATH, check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT,
    room TEXT,
    text TEXT
)
""")

conn.commit()


def save_message(sender, room, text):
    cursor.execute(
        "INSERT INTO messages (sender, room, text) VALUES (?, ?, ?)",
        (sender, room, text)
    )
    conn.commit()


def get_messages(room):
    cursor.execute(
        "SELECT sender, text FROM messages WHERE room=?",
        (room,)
    )
    return cursor.fetchall()