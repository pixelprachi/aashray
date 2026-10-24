from datetime import datetime, timedelta

from app.services.complaint import BLANK, IST, _clean, _val

HOURS = 2

KINDS = {
    "intimate": (
        "intimate image shared without consent",
        "shows my private areas, or shows nudity or a sexual act, and it was shared "
        "without my consent.",
    ),
    "morphed": (
        "morphed intimate image",
        "is an artificially morphed or edited image that shows me nude or in a sexual "
        "act. I did not consent to it.",
    ),
    "impersonation": (
        "impersonation",
        "electronically impersonates me, and I did not consent to it.",
    ),
}


def _sent(s: str) -> datetime:
    try:
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=IST)
        return dt.astimezone(IST)
    except ValueError:
        return datetime.now(IST)


def _fmt(dt: datetime) -> str:
    return dt.strftime("%d %b %Y, %I:%M %p IST")


def build_takedown(d: dict) -> dict:
    subject, desc = KINDS[d["kind"]]
    sent = _sent(d.get("sent_at", ""))
    by = sent + timedelta(hours=HOURS)

    L: list[str] = [
        "To,",
        "The Grievance Officer",
        _clean(d["platform"]),
        "",
        f"Date: {sent.strftime('%d %B %Y')}",
        f"Subject: Request to remove content within {HOURS} hours ({subject})",
        "",
        f"Complainant: {_val(d.get('complainant_name'))}",
        f"Contact details: {BLANK}",
        f"Police complaint reference (if any): {_clean(d.get('police_ref')) or 'None yet'}",
        "",
        "1. The content",
        f"I am writing to report content on your platform that {desc}",
        "Where it can be found:",
    ]
    L += [f"  {i}. {u}" for i, u in enumerate(d["urls"], 1)]
    L += [
        f"First seen: {_val(d.get('found_on'))}",
        "",
        "2. My request",
        f"I request that you remove or disable access to this content within {HOURS} hours "
        "of receiving this notice. I understand that the Information Technology "
        "(Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, as amended "
        "in February 2026, require this for complaints of this kind. Please confirm in "
        "writing once it has been removed.",
        "",
        "3. Keeping records",
        "Please keep a copy of the content and the records of the account that posted it, "
        "so that they can be shared with law enforcement if needed.",
        "",
        "4. When this was sent",
        f"Sent on: {_fmt(sent)}",
        f"{HOURS} hours from then: {_fmt(by)}",
        "",
        "Signature: ______________________",
        "",
        "Draft prepared with Aashray from the complainant's own account. It is not legal advice.",
    ]
    text = "\n".join(L)
    return {
        "text": text,
        "hours": HOURS,
        "sent_at": sent.isoformat(timespec="seconds"),
        "respond_by": by.isoformat(timespec="seconds"),
        "blanks": text.count(BLANK),
        "next_steps": [
            "Keep a screenshot of the notice you sent and the time you sent it.",
            "If the content is still up after 2 hours, report it at cybercrime.gov.in or call 1930.",
            "If you are in immediate danger, call 112.",
        ],
    }