import re

import bleach


def validate_phone(phone: str) -> bool:
    """Validate Russian phone format: +7XXXXXXXXXX or 7XXXXXXXXXX."""
    cleaned = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    pattern = r"^(\+7|7|8)\d{10}$"
    return bool(re.match(pattern, cleaned))


def validate_email(email: str) -> bool:
    """Basic email validation."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def validate_name(name: str) -> bool:
    """Validate name: 2-50 characters, letters and spaces only."""
    if not 2 <= len(name) <= 50:
        return False
    return bool(re.match(r"^[a-zA-Zа-яА-ЯёЁ\s\-]+$", name))


def sanitize_text(text: str) -> str:
    """Strip HTML tags and normalize whitespace."""
    cleaned = bleach.clean(text, tags=[], strip=True)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned
