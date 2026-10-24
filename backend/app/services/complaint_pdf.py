import re
from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer

BODY = ParagraphStyle("body", fontName="Helvetica", fontSize=10.5, leading=15)
HEAD = ParagraphStyle("head", parent=BODY, fontName="Helvetica-Bold", fontSize=11.5, spaceBefore=6)
INDENT = ParagraphStyle("indent", parent=BODY, leftIndent=14)
MONO = ParagraphStyle("mono", parent=INDENT, fontName="Courier", fontSize=8, leading=11)

HEADING = re.compile(r"^(\d\. |Annexure A)")
HASHLINE = re.compile(r"^\s+(File SHA-256|Record hash):")


def _footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.drawString(20 * mm, 12 * mm, "Draft prepared with Aashray. Not legal advice.")
    canvas.drawRightString(A4[0] - 20 * mm, 12 * mm, f"Page {doc.page}")
    canvas.restoreState()


def render_pdf(text: str) -> bytes:
    # The built-in PDF fonts cannot draw Devanagari. Fail loudly instead of printing boxes.
    text.encode("cp1252")  # raises UnicodeEncodeError if unsupported

    story = []
    for line in text.split("\n"):
        if not line.strip():
            story.append(Spacer(1, 6))
            continue
        if line.startswith("Annexure A"):
            story.append(PageBreak())
        if HEADING.match(line):
            style = HEAD
        elif HASHLINE.match(line):
            style = MONO
        elif line.startswith("  "):
            style = INDENT
        else:
            style = BODY
        story.append(Paragraph(escape(line.strip()), style))

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=22 * mm,
        title="Complaint draft",
        author="Aashray",
    )
    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    return buf.getvalue()