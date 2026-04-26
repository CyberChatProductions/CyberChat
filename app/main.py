from fastapi import FastAPI
from app.db import engine, Base
from app.routes import chat

app = FastAPI()

# создаём таблицы при старте
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

# подключаем роуты
app.include_router(chat.router, prefix="/chat", tags=["Chat"])


@app.get("/")
def root():
    return {"status": "server is running"}