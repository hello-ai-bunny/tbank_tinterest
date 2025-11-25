from datetime import datetime, timedelta, timezone
from jose import jwt
from .config import SECRET_KEY, ALGORITHM


def create_access_token(data: dict) -> str:
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(days=365)

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
