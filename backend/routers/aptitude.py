from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from database.db import get_db
from models.models import Question, TestAttempt, User
from routers.auth import get_current_user
from services.llm_service import generate_test_feedback
import random
router = APIRouter(prefix="/aptitude", tags=["aptitude"])
class AnswerItem(BaseModel): question_id: int; selected_answer: str
class TestSubmit(BaseModel): answers: List[AnswerItem]; time_taken: int; test_type: str="aptitude"
@router.get("/questions")
async def get_questions(category: Optional[str]=None, difficulty: Optional[str]=None, count: int=15, db: Session=Depends(get_db), cu: User=Depends(get_current_user)):
    q = db.query(Question).filter(Question.category!="coding", Question.is_active==True)
    if category and category!="all": q=q.filter(Question.category==category)
    if difficulty: q=q.filter(Question.difficulty==difficulty)
    qs=q.all(); random.shuffle(qs)
    return [{"id":x.id,"category":x.category,"difficulty":x.difficulty,"question_text":x.question_text,"options":x.options,"tags":x.tags} for x in qs[:count]]
@router.post("/submit")
async def submit_test(sub: TestSubmit, db: Session=Depends(get_db), cu: User=Depends(get_current_user)):
    if not sub.answers: raise HTTPException(400,"No answers")
    qs={x.id:x for x in db.query(Question).filter(Question.id.in_([a.question_id for a in sub.answers])).all()}
    correct=0; total=len(sub.answers); detailed=[]; wrong=[]
    for ans in sub.answers:
        q=qs.get(ans.question_id)
        if not q: continue
        ok=ans.selected_answer==q.correct_answer
        if ok: correct+=1
        else: wrong.append({"q":q.question_text[:60],"yours":ans.selected_answer,"correct":q.correct_answer})
        detailed.append({"question_id":ans.question_id,"question_text":q.question_text[:100],"selected":ans.selected_answer,"correct":q.correct_answer,"is_correct":ok,"explanation":q.explanation})
    pct=(correct/total*100) if total>0 else 0; xp=int(pct/10)*5
    feedback=await generate_test_feedback(sub.test_type,correct,total,pct,sub.time_taken,wrong)
    db.add(TestAttempt(user_id=cu.id,test_type=sub.test_type,score=correct,max_score=total,percentage=pct,time_taken=sub.time_taken,answers=detailed,feedback=feedback,xp_earned=xp,completed_at=datetime.utcnow()))
    cu.total_xp=(cu.total_xp or 0)+xp; db.commit()
    return {"score":correct,"max_score":total,"percentage":round(pct,2),"correct":correct,"wrong":total-correct,"time_taken":sub.time_taken,"feedback":feedback,"detailed_answers":detailed,"xp_earned":xp}
