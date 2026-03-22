from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from models.models import TestAttempt, CommunicationAttempt, User
from routers.auth import get_current_user
from datetime import datetime, timedelta
router = APIRouter(prefix="/dashboard", tags=["dashboard"])
@router.get("/stats")
async def get_stats(db: Session=Depends(get_db), cu: User=Depends(get_current_user)):
    uid=cu.id; att=db.query(TestAttempt).filter(TestAttempt.user_id==uid).all(); comm=db.query(CommunicationAttempt).filter(CommunicationAttempt.user_id==uid).all()
    apt=[a for a in att if a.test_type in("aptitude","quantitative","logical")]; cod=[a for a in att if a.test_type=="coding"]
    def avg(l): v=[i.percentage for i in l if i.percentage]; return round(sum(v)/len(v),1) if v else 0
    def best(l): v=[i.percentage for i in l if i.percentage]; return round(max(v),1) if v else 0
    la=apt[-1] if apt else None; lc=cod[-1] if cod else None; lm=comm[-1] if comm else None
    tt=sum(a.time_taken or 0 for a in att)/60+sum(a.duration_seconds or 0 for a in comm)/60
    return {"user":{"name":cu.name,"email":cu.email,"college":cu.college,"branch":cu.branch,"year":cu.year,"total_xp":cu.total_xp or 0,"avatar_color":cu.avatar_color},"summary":{"total_tests":len(att)+len(comm),"aptitude_tests":len(apt),"coding_tests":len(cod),"communication_tests":len(comm),"total_time_minutes":round(tt,1)},"scores":{"aptitude_avg":avg(apt),"aptitude_best":best(apt),"coding_avg":avg(cod),"coding_best":best(cod),"communication_avg":round(sum(a.overall_score or 0 for a in comm)/len(comm)*10,1) if comm else 0,"communication_best":round(max((a.overall_score or 0 for a in comm),default=0)*10,1)},"trends":{"aptitude":[{"date":str(a.started_at.date()),"score":a.percentage} for a in sorted(apt,key=lambda x:x.started_at)[-10:] if a.percentage],"coding":[{"date":str(a.started_at.date()),"score":a.percentage} for a in sorted(cod,key=lambda x:x.started_at)[-10:] if a.percentage]},"last_attempts":{"aptitude":{"score":la.percentage,"date":str(la.started_at.date()),"feedback":la.feedback} if la else None,"coding":{"score":lc.percentage,"date":str(lc.started_at.date())} if lc else None,"communication":{"score":(lm.overall_score or 0)*10,"date":str(lm.created_at.date()),"topic":lm.topic} if lm else None}}
