import os
import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import MatchLog, ShieldEntry

router = APIRouter(prefix="/shield", tags=["shield"])

THRESHOLD = int(os.getenv("MATCH_THRESHOLD", "10"))
AUTO_APPROVE = os.getenv("AUTO_APPROVE", "true").lower() == "true"
HEX16 = re.compile(r"^[0-9a-fA-F]{16}$")


def to_signed(h: str) -> int:
    v = int(h, 16)
    return v - (1 << 64) if v >= (1 << 63) else v


def check(*hashes: str) -> None:
    for h in hashes:
        if not HEX16.match(h):
            raise HTTPException(status_code=422, detail="hashes must be 16 hex characters")


class RegisterIn(BaseModel):
    phash: str
    dhash: str
    phash_flip: str
    dhash_flip: str
    vault_id: str | None = None


class MatchIn(BaseModel):
    phash: str
    dhash: str
    platform: str = "unknown"


@router.post("/register")
def register(body: RegisterIn, db: Session = Depends(get_db)):
    check(body.phash, body.dhash, body.phash_flip, body.dhash_flip)
    entry = ShieldEntry(
        phash=to_signed(body.phash),
        dhash=to_signed(body.dhash),
        phash_flip=to_signed(body.phash_flip),
        dhash_flip=to_signed(body.dhash_flip),
        status="approved" if AUTO_APPROVE else "pending",
        vault_id=body.vault_id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"id": str(entry.id), "status": entry.status}


MATCH_SQL = text("""
    SELECT id,
           LEAST(
             GREATEST(
               bit_count(CAST(phash # CAST(:p AS bigint) AS bit(64))),
               bit_count(CAST(dhash # CAST(:d AS bigint) AS bit(64)))
             ),
             GREATEST(
               bit_count(CAST(phash_flip # CAST(:p AS bigint) AS bit(64))),
               bit_count(CAST(dhash_flip # CAST(:d AS bigint) AS bit(64)))
             )
           ) AS dist
    FROM shield_registry
    WHERE status = 'approved'
    ORDER BY dist ASC
    LIMIT 1
""")


@router.post("/match")
def match(body: MatchIn, db: Session = Depends(get_db)):
    check(body.phash, body.dhash)
    row = db.execute(MATCH_SQL, {"p": to_signed(body.phash), "d": to_signed(body.dhash)}).first()
    if row is None:
        return {"match": False, "distance": None, "confidence": 0.0, "registry_id": None, "threshold": THRESHOLD}
    dist = int(row.dist)
    matched = dist <= THRESHOLD
    if matched:
        db.add(MatchLog(registry_id=row.id, distance=dist, platform=body.platform))
        db.commit()
    return {
        "match": matched,
        "distance": dist,
        "confidence": round(1 - dist / 64, 3),
        "registry_id": str(row.id) if matched else None,
        "threshold": THRESHOLD,
    }
