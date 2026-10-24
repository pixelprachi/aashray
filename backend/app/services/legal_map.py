DISCLAIMER = (
    "These are possible matches, not legal advice. "
    "A lawyer or the police can tell you what actually applies to your situation."
)

SECTIONS = {
    "BNS 75": {
        "act": "Bharatiya Nyaya Sanhita, 2023",
        "title": "Sexual harassment",
        "plain": "Unwelcome advances, demands for sexual favours, showing sexual material against someone's will, or sexually coloured remarks.",
    },
    "BNS 77": {
        "act": "Bharatiya Nyaya Sanhita, 2023",
        "title": "Voyeurism",
        "plain": "Capturing or sharing images of a woman in a private moment without her consent.",
    },
    "BNS 78": {
        "act": "Bharatiya Nyaya Sanhita, 2023",
        "title": "Stalking",
        "plain": "Following a woman, or repeatedly contacting or monitoring her online, despite clear disinterest.",
    },
    "BNS 79": {
        "act": "Bharatiya Nyaya Sanhita, 2023",
        "title": "Insulting the modesty of a woman",
        "plain": "Words, gestures or acts meant to insult a woman's modesty or intrude on her privacy.",
    },
    "BNS 308": {
        "act": "Bharatiya Nyaya Sanhita, 2023",
        "title": "Extortion",
        "plain": "Threatening someone to make them hand over money, something valuable, or anything else.",
    },
    "BNS 351(2)": {
        "act": "Bharatiya Nyaya Sanhita, 2023",
        "title": "Criminal intimidation",
        "plain": "Threatening someone with harm to themselves, their reputation or their property.",
    },
    "IT 66E": {
        "act": "Information Technology Act, 2000",
        "title": "Violation of privacy",
        "plain": "Capturing, publishing or sending a private image of someone without consent.",
    },
    "IT 67": {
        "act": "Information Technology Act, 2000",
        "title": "Obscene material online",
        "plain": "Publishing or sending obscene material in electronic form.",
    },
    "IT 67A": {
        "act": "Information Technology Act, 2000",
        "title": "Sexually explicit material online",
        "plain": "Publishing or sending sexually explicit material in electronic form.",
    },
    "IT 66C": {
        "act": "Information Technology Act, 2000",
        "title": "Identity theft",
        "plain": "Dishonestly using someone else's password or unique identity.",
    },
    "IT 66D": {
        "act": "Information Technology Act, 2000",
        "title": "Cheating by pretending to be someone else online",
        "plain": "Cheating by impersonating another person using a phone or computer.",
    },
}

ABUSE_TYPES = {
    "sextortion": {
        "label": "Sextortion",
        "blurb": "Threatening to share private images unless you pay or send more.",
        "sections": ["BNS 308", "BNS 351(2)"],
        "if_shared": ["IT 66E", "IT 67", "IT 67A"],
        "review": False,
    },
    "ncii_leak": {
        "label": "Private images shared without consent",
        "blurb": "Your private images or videos were posted or sent to others.",
        "sections": ["BNS 77", "IT 66E", "IT 67", "IT 67A"],
        "review": False,
    },
    "morphed_deepfake": {
        "label": "Edited or fake images of you",
        "blurb": "Images or videos altered or generated to look like you.",
        "sections": ["BNS 79", "IT 67", "IT 67A", "IT 66C", "IT 66D"],
        "review": True,
    },
    "stalking": {
        "label": "Stalking",
        "blurb": "Repeated contact or monitoring after you made it clear you do not want it.",
        "sections": ["BNS 78"],
        "review": False,
    },
    "sexual_harassment": {
        "label": "Sexual harassment",
        "blurb": "Unwelcome sexual messages, remarks or demands.",
        "sections": ["BNS 75", "BNS 79"],
        "review": False,
    },
    "threats": {
        "label": "Threats",
        "blurb": "Threats of harm to you, your reputation or your belongings.",
        "sections": ["BNS 351(2)"],
        "review": False,
    },
    "impersonation": {
        "label": "Someone pretending to be you",
        "blurb": "A fake account or identity using your name or photos.",
        "sections": ["IT 66C", "IT 66D"],
        "review": False,
    },
    "obscene_messages": {
        "label": "Obscene messages",
        "blurb": "Receiving obscene or explicit messages you did not ask for.",
        "sections": ["BNS 79", "IT 67"],
        "review": False,
    },
    "other": {
        "label": "Something else",
        "blurb": "This does not clearly fit one of the usual categories.",
        "sections": [],
        "review": False,
    },
}


def sections_for(abuse_type: str, images_shared: bool) -> list[dict]:
    info = ABUSE_TYPES[abuse_type]
    codes = list(info["sections"])
    if images_shared:
        codes += info.get("if_shared", [])
    return [{"code": c, **SECTIONS[c]} for c in codes]
