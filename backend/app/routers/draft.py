from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field, field_validator
from app.services.section63 import build_section63

from app.services.complaint import build_complaint
from app.services.complaint_pdf import render_pdf
from app.services.legal_map import ABUSE_TYPES
from app.services.takedown import build_takedown

router = APIRouter(prefix="/draft")

Url = Annotated[str, Field(min_length=8, max_length=500, pattern=r"^https?://\S+$")]


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
    use_ai: bool = False
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


class PdfIn(BaseModel):
    text: str = Field(min_length=20, max_length=20000)


@router.post("/pdf")
def pdf(body: PdfIn):
    try:
        data = render_pdf(body.text)
    except UnicodeEncodeError:
        raise HTTPException(
            422, "The PDF supports English characters only for now. Please use the text version."
        )
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="aashray-complaint-draft.pdf"'},
    )


class TakedownIn(BaseModel):
    kind: Literal["intimate", "morphed", "impersonation"]
    platform: str = Field(min_length=2, max_length=120)
    urls: list[Url] = Field(min_length=1, max_length=20)
    found_on: str = Field(default="", max_length=80)
    complainant_name: str = Field(default="", max_length=120)
    police_ref: str = Field(default="", max_length=120)
    sent_at: str = Field(default="", max_length=40)


@router.post("/takedown")
def takedown(body: TakedownIn):
    return build_takedown(body.model_dump())

class Section63In(BaseModel):
    declarant_name: str = Field(min_length=2, max_length=120)
    relative_name: str = Field(default="", max_length=120)
    address: str = Field(default="", max_length=300)
    capacity: str = Field(default="", max_length=120)
    device_kind: Literal["mobile phone", "computer", "storage media", "cloud or online account", "other"]
    make_model: str = Field(default="", max_length=120)
    serial_or_imei: str = Field(default="", max_length=120)
    device_owner: str = Field(default="", max_length=120)
    place: str = Field(default="", max_length=120)
    entries: list[Entry] = Field(min_length=1, max_length=200)


@router.post("/section63")
def section63(body: Section63In):
    return build_section63(body.model_dump())

@router.get("/types")
def types():
    return [{"key": k, "label": v["label"], "blurb": v["blurb"]} for k, v in ABUSE_TYPES.items()]