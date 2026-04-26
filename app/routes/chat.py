from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app import models, schemas

router = APIRouter()

# зависимость для БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/send", response_model=schemas.MessageResponse)
def send_message(msg: schemas.MessageCreate, db: Session = Depends(get_db)):
    message = models.Message(
        username=msg.username,
        content=msg.content
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/messages", response_model=list[schemas.MessageResponse])
def get_messages(db: Session = Depends(get_db)):
    return db.query(models.Message).all()