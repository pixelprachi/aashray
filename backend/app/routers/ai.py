from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.classify import classify_text
from app.services.llm import LLMError

router = APIRouter(prefix="/ai")


class ClassifyIn(BaseModel):
    text: str = Field(min_length=10, max_length=8000)


@router.post("/classify")
def classify(body: ClassifyIn):
    try:
        return classify_text(body.text)
    except LLMError as e:
        print("AI error:", e)
        raise HTTPException(502, "The assistant is unavailable right now.")
