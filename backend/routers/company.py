from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from database.db import get_db
from models.models import CompanyQuestion, TestAttempt, User
from routers.auth import get_current_user
import random
router = APIRouter(prefix="/company", tags=["company"])
COMPANIES=[{"id":"tcs","name":"TCS","color":"#0052cc","logo":"T","full_name":"Tata Consultancy Services"},{"id":"infosys","name":"Infosys","color":"#007cc3","logo":"I","full_name":"Infosys Technologies"},{"id":"wipro","name":"Wipro","color":"#8b1a1a","logo":"W","full_name":"Wipro Limited"},{"id":"zoho","name":"Zoho","color":"#e03c31","logo":"Z","full_name":"Zoho Corporation"},{"id":"accenture","name":"Accenture","color":"#a100ff","logo":"A","full_name":"Accenture"},{"id":"cognizant","name":"Cognizant","color":"#0033a0","logo":"C","full_name":"Cognizant"},{"id":"hcl","name":"HCL","color":"#00a651","logo":"H","full_name":"HCL Technologies"},{"id":"techmahindra","name":"TechM","color":"#cc0000","logo":"M","full_name":"Tech Mahindra"}]
class AnswerItem(BaseModel): question_id: int; selected_answer: str
class CompanySubmit(BaseModel): answers: List[AnswerItem]; company: str; time_taken: int
@router.get("/list")
async def list_companies(db: Session=Depends(get_db), cu: User=Depends(get_current_user)):
    return [{**c,"question_count":db.query(CompanyQuestion).filter(CompanyQuestion.company==c["id"],CompanyQuestion.is_active==True).count()} for c in COMPANIES]
@router.get("/{company}/questions")
async def get_company_questions(company: str, category: Optional[str]=None, count: int=15, db: Session=Depends(get_db), cu: User=Depends(get_current_user)):
    q=db.query(CompanyQuestion).filter(CompanyQuestion.company==company.lower(),CompanyQuestion.is_active==True)
    if category: q=q.filter(CompanyQuestion.category==category)
    qs=q.all(); random.shuffle(qs)
    return [{"id":x.id,"category":x.category,"difficulty":x.difficulty,"question_text":x.question_text,"options":x.options,"tags":x.tags,"year":x.year} for x in qs[:count]]
@router.post("/submit")
async def submit_company(sub: CompanySubmit, db: Session=Depends(get_db), cu: User=Depends(get_current_user)):
    qs={x.id:x for x in db.query(CompanyQuestion).filter(CompanyQuestion.id.in_([a.question_id for a in sub.answers])).all()}
    correct=0; total=len(sub.answers); detailed=[]
    for ans in sub.answers:
        x=qs.get(ans.question_id)
        if not x: continue
        ok=ans.selected_answer==x.correct_answer
        if ok: correct+=1
        detailed.append({"question_id":ans.question_id,"question_text":x.question_text[:100],"selected":ans.selected_answer,"correct":x.correct_answer,"is_correct":ok,"explanation":x.explanation})
    pct=(correct/total*100) if total>0 else 0; xp=int(pct/10)*8
    db.add(TestAttempt(user_id=cu.id,test_type=f"company_{sub.company}",score=correct,max_score=total,percentage=pct,time_taken=sub.time_taken,answers=detailed,feedback=f"{sub.company.upper()}: {correct}/{total}",xp_earned=xp,completed_at=datetime.utcnow()))
    cu.total_xp=(cu.total_xp or 0)+xp; db.commit()
    return {"score":correct,"max_score":total,"percentage":round(pct,2),"correct":correct,"wrong":total-correct,"detailed_answers":detailed}
