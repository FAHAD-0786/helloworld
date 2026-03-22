from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import hashlib

SECRET_KEY = os.getenv("SECRET_KEY", "localdevsecretkey123abc")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _prep(pw: str) -> str:
    # bcrypt limit is 72 bytes. SHA256 the password first so any length works.
    return hashlib.sha256(pw.encode()).hexdigest()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(_prep(plain), hashed)
    except Exception:
        return False


def get_password_hash(pw: str) -> str:
    return pwd_context.hash(_prep(pw))


def create_access_token(data: dict, expires_delta=None):
    d = data.copy()
    d["exp"] = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return jwt.encode(d, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def get_user_by_email(db, email: str):
    from models.models import User
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user