"""
Anonymous session identity.

We never store Django's raw session key next to user content. Instead every
complaint/confirmation/flag stores a keyed hash of it. Properties:

- Deterministic per browser session -> uniqueness constraints work.
- One-way: DB leak alone can't recover session keys.
- Keyed with SECRET_KEY: an attacker who *guesses* session keys still can't
  compute matching hashes without the server secret.
"""
import hashlib

from django.conf import settings


def get_session_hash(request) -> str:
    """Return a stable 64-char hex ID for this anonymous visitor."""
    if not request.session.session_key:
        # First touch: create the anonymous session (sets the cookie).
        request.session.create()
        # Make the session survive: an empty session won't be saved otherwise.
        request.session["a"] = 1
    raw = f"{settings.SECRET_KEY}:{request.session.session_key}"
    return hashlib.sha256(raw.encode()).hexdigest()
