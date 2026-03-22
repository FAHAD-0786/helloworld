from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from database.db import get_db
from models.models import User
from services.auth_service import get_password_hash, authenticate_user, create_access_token, decode_token, get_user_by_email

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

class RegisterRequest(BaseModel):
    name: str; email: EmailStr; password: str
    college: Optional[str]=None; branch: Optional[str]=None; year: Optional[int]=None

async def get_current_user(token: str=Depends(oauth2_scheme), db: Session=Depends(get_db)):
    payload = decode_token(token)
    if not payload: raise HTTPException(status_code=401, detail="Invalid credentials", headers={"WWW-Authenticate":"Bearer"})
    user = get_user_by_email(db, payload.get("sub"))
    if not user: raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/register")
async def register(req: RegisterRequest, db: Session=Depends(get_db)):
    if get_user_by_email(db, req.email): raise HTTPException(400, "Email already registered")
    user = User(name=req.name, email=req.email, hashed_password=get_password_hash(req.password), college=req.college, branch=req.branch, year=req.year)
    db.add(user); db.commit(); db.refresh(user)
    return {"id":user.id,"name":user.name,"email":user.email}

@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm=Depends(), db: Session=Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user: raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"access_token":create_access_token({"sub":user.email}),"token_type":"bearer","user":{"id":user.id,"name":user.name,"email":user.email}}

@router.get("/me")
async def me(cu: User=Depends(get_current_user)):
    return {"id":cu.id,"name":cu.name,"email":cu.email,"college":cu.college,"branch":cu.branch,"year":cu.year,"avatar_color":cu.avatar_color,"total_xp":cu.total_xp or 0}
