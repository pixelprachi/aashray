from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.db import engine

app = FastAPI(title="Aashray API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    with engine.connect() as conn:
        conn.execute(text("select 1"))
    return {"status": "ok", "db": "connected"}
