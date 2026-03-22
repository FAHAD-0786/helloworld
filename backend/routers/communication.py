from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database.db import get_db
from models.models import CommunicationAttempt, User
from routers.auth import get_current_user
from services.llm_service import analyze_communication
import random
router = APIRouter(prefix="/communication", tags=["communication"])
TOPICS=["Tell me about yourself","Why do you want to work in IT?","What are your strengths and weaknesses?","Describe a challenging situation you faced","Where do you see yourself in 5 years?","Why should we hire you?","Describe your final year project","What motivates you?","How do you handle pressure?","Tell me about a time you worked in a team"]
FILLERS=["um","uh","er","ah","like","you know","basically","actually","literally","so basically","right","okay so"]
class CommSub(BaseModel): transcript: str; topic: str; duration_seconds: int; words_per_minute: Optional[float]=None
@router.get("/topics")
async def get_topics(cu: User=Depends(get_current_user)):
    return {"topics":random.sample(TOPICS,min(6,len(TOPICS)))}
@router.post("/analyze")
async def analyze_speech(sub: CommSub, db: Session=Depends(get_db), cu: User=Depends(get_current_user)):
    lower=sub.transcript.lower(); wc=len(lower.split())
    wpm=sub.words_per_minute or ((wc/sub.duration_seconds*60) if sub.duration_seconds>0 else 0)
    ff=[]; [ff.extend([f]*(lower.count(f" {f} ")+lower.count(f" {f}."))) for f in FILLERS]
    a=await analyze_communication(sub.topic,sub.transcript,wpm,ff,sub.duration_seconds)
    db.add(CommunicationAttempt(user_id=cu.id,transcript=sub.transcript,topic=sub.topic,words_per_minute=wpm,filler_word_count=len(ff),fluency_score=a["fluency_score"],overall_score=a["overall_score"],feedback=a["feedback"],duration_seconds=sub.duration_seconds))
    db.commit()
    return {"fluency_score":a["fluency_score"],"vocabulary_score":a["vocabulary_score"],"overall_score":a["overall_score"],"words_per_minute":round(wpm,1),"filler_word_count":len(ff),"filler_words_found":list(set(ff)),"feedback":a["feedback"]}
