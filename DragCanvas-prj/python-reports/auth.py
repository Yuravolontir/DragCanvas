"""Authentication module - verifies the JWT issued by the Node API.

Why this exists: these reports read the whole database - how many users there
are, who owns what, what everyone has been doing. Before this module the service
answered anyone who knew the address, with CORS wide open.

Rather than inventing a second login here, the service trusts the same token the
Node API already issues. The browser holds one; it simply sends it here too.
Both services read JWT_SECRET from the environment, so a token signed by one is
readable by the other.
"""
import os

import jwt
from dotenv import load_dotenv
from fastapi import Header, HTTPException, Query

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"


def _decode(token):
    """Return the token payload, or raise the right HTTP error."""
    if not JWT_SECRET:
        # Refusing is safer than letting everyone in because a variable is unset
        raise HTTPException(status_code=500, detail="JWT_SECRET is not configured on the reports service")

    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def _require_admin_payload(payload):
    """Statistics are an admin view; ordinary users have no business here."""
    if not (payload.get("isAdmin") or payload.get("isSuperAdmin")):
        raise HTTPException(status_code=403, detail="Admin permissions required")
    return payload


def require_admin(authorization: str = Header(None)):
    """Dependency for JSON endpoints: reads "Authorization: Bearer <token>"."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authentication token")

    return _require_admin_payload(_decode(authorization[7:]))


def require_admin_query(token: str = Query(None)):
    """Dependency for chart images.

    A chart is displayed with <img src="...">, and an image request cannot carry
    an Authorization header, so the token arrives as a query parameter instead.
    This is deliberately weaker - query strings end up in server logs - and it is
    accepted only because the alternative is leaving the charts open.
    """
    if not token:
        raise HTTPException(status_code=401, detail="Missing authentication token")

    return _require_admin_payload(_decode(token))
