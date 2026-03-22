from fastapi import APIRouter, Depends
from pydantic import BaseModel
from models.models import User
from routers.auth import get_current_user
from services.llm_service import chat_with_assistant, is_ollama_running
import uuid
router = APIRouter(prefix="/assistant", tags=["assistant"])
class ChatReq(BaseModel): message: str; session_id: str=""
@router.post("/chat")
async def chat(req: ChatReq, cu: User=Depends(get_current_user)):
    sid=req.session_id or f"{cu.id}_{uuid.uuid4().hex[:8]}"
    return {"reply":await chat_with_assistant(req.message,sid),"session_id":sid}
@router.get("/status")
async def ai_status(): return {"online":is_ollama_running()}
