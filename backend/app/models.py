import uuid
from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from app.db import Base


class ShieldEntry(Base):
    __tablename__ = "shield_registry"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phash = Column(BigInteger, nullable=False)
    dhash = Column(BigInteger, nullable=False)
    phash_flip = Column(BigInteger, nullable=False)
    dhash_flip = Column(BigInteger, nullable=False)
    status = Column(String, nullable=False, default="pending")
    vault_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MatchLog(Base):
    __tablename__ = "match_log"
    id = Column(Integer, primary_key=True, autoincrement=True)
    registry_id = Column(UUID(as_uuid=True), ForeignKey("shield_registry.id"), nullable=False)
    distance = Column(Integer, nullable=False)
    platform = Column(String, nullable=False, default="unknown")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
