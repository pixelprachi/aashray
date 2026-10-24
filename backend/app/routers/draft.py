from fastapi import APIRouter
from pydantic import BaseModel, Field, field_validator

from app.services.complaint import build_complaint
from app.services.legal_map import ABUSE_TYPES

router = APIRouter(prefix="/draft")


class Entry(BaseModel):
    seq: int = Field(ge=1, le=100000)
    captured_at: str = Field(max_length=40)
    label: str = Field(default="", max_length=200)
    file_sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    entry_hash: str = Field(pattern=r"^[0-9a-f]{64}$")


class ComplaintIn(BaseModel):
    types: list[str] = Field(min_length=1, max_length=3)
    images_shared: bool = False
    what_happened: str = Field(min_length=10, max_length=4000)
    first_date: str = Field(default="", max_length=80)
    frequency: str = Field(default="", max_length=200)
    accused: str = Field(default="", max_length=300)
    platform: str = Field(default="", max_length=200)
    complainant_name: str = Field(default="", max_length=120)
    entries: list[Entry] = Field(default_factory=list, max_length=200)

    @field_validator("types")
    @classmethod
    def known_types(cls, v: list[str]) -> list[str]:
        for t in v:
            if t not in ABUSE_TYPES:
                raise ValueError(f"unknown type: {t}")
        return v


@router.post("/complaint")
def complaint(body: ComplaintIn):
    return build_complaint(body.model_dump())