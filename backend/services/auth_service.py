from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

SECRET_KEY = os.getenv("SECRET_KEY", "localdevsecretkey123abc")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)
def get_password_hash(pw): return pwd_context.hash(pw)
def create_access_token(data, expires_delta=None):
    d = data.copy()
    d["exp"] = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return jwt.encode(d, SECRET_KEY, algorithm=ALGORITHM)
def decode_token(token):
    try: return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError: return None
def get_user_by_email(db, email):
    from models.models import User
    return db.query(User).filter(User.email == email).first()
def authenticate_user(db, email, password):
    u = get_user_by_email(db, email)
    return u if u and verify_password(password, u.hashed_password) else None
