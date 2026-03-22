from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database.db import get_db
from models.models import Question, TestAttempt, User
from routers.auth import get_current_user
from services.code_executor import execute_code, run_test_cases
router = APIRouter(prefix="/coding", tags=["coding"])
class RunReq(BaseModel): source_code: str; language: str="python"; stdin: Optional[str]=""
class SubReq(BaseModel): question_id: int; source_code: str; language: str="python"; time_taken: int=0
@router.get("/questions")
async def get_questions(difficulty: Optional[str]=None, db: Session=Depends(get_db), cu: User=Depends(get_current_user)):
    q=db.query(Question).filter(Question.category=="coding",Question.is_active==True)
    if difficulty: q=q.filter(Question.difficulty==difficulty)
    return [{"id":x.id,"category":x.category,"difficulty":x.difficulty,"question_text":x.question_text,"starter_code":x.starter_code,"tags":x.tags} for x in q.all()]
@router.post("/run")
async def run_code(req: RunReq, cu: User=Depends(get_current_user)):
    return await execute_code(req.source_code,req.language,req.stdin or "")
@router.post("/submit")
async def submit_code(req: SubReq, db: Session=Depends(get_db), cu: User=Depends(get_current_user)):
    q=db.query(Question).filter(Question.id==req.question_id,Question.category=="coding").first()
    if not q: raise HTTPException(404,"Not found")
    if not q.test_cases: raise HTTPException(400,"No test cases")
    r=await run_test_cases(req.source_code,req.language,q.test_cases); xp=int(r["percentage"]/10)*10
    db.add(TestAttempt(user_id=cu.id,test_type="coding",score=r["passed"],max_score=r["total"],percentage=r["percentage"],time_taken=req.time_taken,answers={"qid":req.question_id,"lang":req.language,"results":r["results"]},feedback=f"Passed {r['passed']}/{r['total']} ({r['percentage']:.1f}%)",xp_earned=xp,completed_at=datetime.utcnow()))
    cu.total_xp=(cu.total_xp or 0)+xp; db.commit()
    return {"passed":r["passed"],"total":r["total"],"percentage":round(r["percentage"],2),"test_results":r["results"],"xp_earned":xp}
