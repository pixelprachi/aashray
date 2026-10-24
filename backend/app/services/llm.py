import json
import os
import re

import httpx


class LLMError(Exception):
    pass


def ask_json(system: str, user: str, timeout: float = 40.0) -> dict:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise LLMError("GEMINI_API_KEY is not set")
    model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    body = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.1},
    }
    try:
        r = httpx.post(url, params={"key": key}, json=body, timeout=timeout)
    except httpx.HTTPError as e:
        raise LLMError(f"network error: {type(e).__name__}") from e
    if r.status_code != 200:
        raise LLMError(f"model {model} returned {r.status_code}: {r.text[:300]}")
    try:
        parts = r.json()["candidates"][0]["content"]["parts"]
        text = "".join(p.get("text", "") for p in parts if not p.get("thought"))
        text = re.sub(r"^```(?:json)?|```$", "", text.strip()).strip()
        return json.loads(text)
    except (KeyError, IndexError, ValueError) as e:
        raise LLMError("unexpected response shape") from e
