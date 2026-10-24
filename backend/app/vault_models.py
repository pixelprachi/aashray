import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Vault(Base):
    __tablename__ = "vaults"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    salt: Mapped[str] = mapped_column(String(64))
    iterations: Mapped[int] = mapped_column(Integer)
    check_iv: Mapped[str] = mapped_column(String(64))
    check_ct: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class EvidenceEntry(Base):
    __tablename__ = "evidence_chain"
    __table_args__ = (UniqueConstraint("vault_id", "seq"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vault_id: Mapped[str] = mapped_column(ForeignKey("vaults.id"), index=True)
    seq: Mapped[int] = mapped_column(Integer)
    file_sha256: Mapped[str] = mapped_column(String(64))
    captured_at: Mapped[str] = mapped_column(String(40))
    prev_hash: Mapped[str] = mapped_column(String(64))
    entry_hash: Mapped[str] = mapped_column(String(64))
    blob_path: Mapped[str] = mapped_column(String(300))
    iv: Mapped[str] = mapped_column(String(64))
    size: Mapped[int] = mapped_column(Integer)
    meta_iv: Mapped[str] = mapped_column(String(64))
    meta_ct: Mapped[str] = mapped_column(Text)
