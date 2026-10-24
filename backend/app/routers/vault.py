import hashlib
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.vault_models import EvidenceEntry, Vault

router = APIRouter(prefix="/vault")

STORAGE = Path(__file__).resolve().parents[2] / "storage"
GENESIS = "GENESIS"
ID_RE = re.compile(r"^[A-Za-z0-9-]{16,64}$")
HEX64 = re.compile(r"^[0-9a-f]{64}$")
MAX_BYTES = 25 * 1024 * 1024


def chain_hash(file_sha256: str, captured_at: str, prev_hash: str) -> str:
    return hashlib.sha256(f"{file_sha256}|{captured_at}|{prev_hash}".encode()).hexdigest()


def to_dict(r: EvidenceEntry) -> dict:
    return {
        "id": str(r.id),
        "seq": r.seq,
        "file_sha256": r.file_sha256,
        "captured_at": r.captured_at,
        "prev_hash": r.prev_hash,
        "entry_hash": r.entry_hash,
        "iv": r.iv,
        "size": r.size,
        "meta_iv": r.meta_iv,
        "meta_ct": r.meta_ct,
    }


def entries(db: Session, vault_id: str) -> list[EvidenceEntry]:
    q = select(EvidenceEntry).where(EvidenceEntry.vault_id == vault_id).order_by(EvidenceEntry.seq)
    return list(db.execute(q).scalars().all())


def need_vault(db: Session, vault_id: str) -> Vault:
    v = db.get(Vault, vault_id)
    if not v:
        raise HTTPException(404, "vault not found")
    return v


class VaultIn(BaseModel):
    vault_id: str
    salt: str
    iterations: int
    check_iv: str
    check_ct: str


@router.post("")
def create_vault(body: VaultIn, db: Session = Depends(get_db)):
    if not ID_RE.match(body.vault_id):
        raise HTTPException(422, "bad vault id")
    if body.iterations < 310_000:
        raise HTTPException(422, "iterations too low")
    if db.get(Vault, body.vault_id):
        raise HTTPException(409, "vault exists")
    db.add(
        Vault(
            id=body.vault_id,
            salt=body.salt,
            iterations=body.iterations,
            check_iv=body.check_iv,
            check_ct=body.check_ct,
        )
    )
    db.commit()
    return {"ok": True}


@router.get("/{vault_id}")
def get_vault(vault_id: str, db: Session = Depends(get_db)):
    v = need_vault(db, vault_id)
    return {"salt": v.salt, "iterations": v.iterations, "check_iv": v.check_iv, "check_ct": v.check_ct}


@router.post("/{vault_id}/evidence")
async def add_evidence(
    vault_id: str,
    blob: UploadFile = File(...),
    file_sha256: str = Form(...),
    iv: str = Form(...),
    meta_iv: str = Form(...),
    meta_ct: str = Form(...),
    db: Session = Depends(get_db),
):
    need_vault(db, vault_id)
    if not HEX64.match(file_sha256):
        raise HTTPException(422, "bad sha256")
    data = await blob.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "file too large")

    rows = entries(db, vault_id)
    last = rows[-1] if rows else None
    prev_hash = last.entry_hash if last else GENESIS
    seq = last.seq + 1 if last else 1
    captured_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    entry_hash = chain_hash(file_sha256, captured_at, prev_hash)

    entry_id = uuid.uuid4()
    folder = STORAGE / vault_id
    folder.mkdir(parents=True, exist_ok=True)
    (folder / f"{entry_id}.bin").write_bytes(data)

    row = EvidenceEntry(
        id=entry_id,
        vault_id=vault_id,
        seq=seq,
        file_sha256=file_sha256,
        captured_at=captured_at,
        prev_hash=prev_hash,
        entry_hash=entry_hash,
        blob_path=f"{vault_id}/{entry_id}.bin",
        iv=iv,
        size=len(data),
        meta_iv=meta_iv,
        meta_ct=meta_ct,
    )
    db.add(row)
    db.commit()
    return to_dict(row)


@router.get("/{vault_id}/evidence")
def list_evidence(vault_id: str, db: Session = Depends(get_db)):
    need_vault(db, vault_id)
    return [to_dict(r) for r in entries(db, vault_id)]


@router.get("/{vault_id}/evidence/{entry_id}/blob")
def get_blob(vault_id: str, entry_id: uuid.UUID, db: Session = Depends(get_db)):
    need_vault(db, vault_id)
    row = db.get(EvidenceEntry, entry_id)
    if not row or row.vault_id != vault_id:
        raise HTTPException(404, "not found")
    path = STORAGE / row.blob_path
    if not path.exists():
        raise HTTPException(404, "blob missing")
    return FileResponse(path, media_type="application/octet-stream")


@router.get("/{vault_id}/verify")
def verify(vault_id: str, db: Session = Depends(get_db)):
    need_vault(db, vault_id)
    rows = entries(db, vault_id)
    expected_prev = GENESIS
    for i, r in enumerate(rows, start=1):
        good = (
            r.seq == i
            and r.prev_hash == expected_prev
            and chain_hash(r.file_sha256, r.captured_at, r.prev_hash) == r.entry_hash
        )
        if not good:
            return {"ok": False, "count": len(rows), "broken_at": r.seq}
        expected_prev = r.entry_hash
    return {"ok": True, "count": len(rows), "broken_at": None}
