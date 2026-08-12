"""Authentication module - verifies the JWT issued by the Node API.

Why this exists: these reports read the whole database - how many users there
are, who owns what, what everyone has been doing. Before this module the service
answered anyone who knew the address, with CORS wide open.

Rather than inventing a second login here, the service trusts the same token the
Node API already issues. The browser holds one; it simply sends it here too.
Both services read JWT_SECRET from the environment, so a token signed by one is
readable by the other.

The token proves WHO the caller is. It does not decide WHAT they may do: the
roles are read from the database on every request, so removing someone's admin
rights - or deactivating them - in the admin panel takes effect here on the next
request instead of waiting up to seven days for the token to expire. The Node
API enforces the same rule on its side, so a demotion bites everywhere at once.
"""
import os

import jwt
from dotenv import load_dotenv
from fastapi import Header, HTTPException

from db import fetch_all

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


def _load_live_roles(user_id):
    """Return (is_active, is_admin, is_super_admin) read from the database, or None.

    The token carries the roles as they were the day it was issued and stays
    valid for seven days, so its isAdmin claim cannot be trusted to authorise an
    admin-only view: a demoted admin would keep seeing the statistics for a week.
    Reading the row instead makes "Remove Admin" and "Deactivate" in the admin
    panel bite here immediately, exactly as they already do on the Node API.
    """
    if user_id is None:
        return None
    columns, rows = fetch_all(
        'SELECT "IsActive", "IsAdmin", "IsSuperAdmin" FROM "TBUsers" WHERE "User_ID" = %s',
        (user_id,),
    )
    if not rows:
        return None
    row = dict(zip(columns, rows[0]))
    return row["IsActive"], row["IsAdmin"], row["IsSuperAdmin"]


def require_admin(authorization: str = Header(None)):
    """The only way in: reads "Authorization: Bearer <token>".

    Charts used to have a second dependency that took the token from the query
    string, because an <img src="..."> cannot send a header. The frontend now
    fetches each chart itself and shows it through a blob: URL, so the header
    works there too - and that weaker path is gone rather than left reachable
    by anyone who knows the URL shape.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authentication token")

    payload = _decode(authorization[7:])

    roles = _load_live_roles(payload.get("userId"))
    if roles is None:
        raise HTTPException(status_code=401, detail="Account no longer exists")
    is_active, is_admin, is_super_admin = roles
    if is_active is False:
        raise HTTPException(status_code=401, detail="Account is deactivated")
    if not (is_admin or is_super_admin):
        raise HTTPException(status_code=403, detail="Admin permissions required")

    return payload
