from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app import models, vault_models  # noqa: F401  (registers the tables)
from app.db import Base, engine, get_db
from app.routers import ai, shield, vault

Base.metadata.create_all(engine)

app = FastAPI(title="Aashray API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(shield.router)
app.include_router(vault.router)


@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "connected"}
app.include_router(ai.router)
