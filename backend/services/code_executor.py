import subprocess, tempfile, shutil, time, os, re
TIME_LIMIT=5
LANG_CONFIG={"python":{"ext":".py","compile":None,"run":["python3","{src}"]},"javascript":{"ext":".js","compile":None,"run":["node","{src}"]},"java":{"ext":".java","compile":["javac","{src}"],"run":["java","-cp","{dir}","Main"],"fix_class":True},"cpp":{"ext":".cpp","compile":["g++","-O2","-o","{exe}","{src}"],"run":["{exe}"]},"c":{"ext":".c","compile":["gcc","-O2","-o","{exe}","{src}"],"run":["{exe}"]}}
BLOCKED=["import os","import sys","import subprocess","import socket","__import__","open(","exec(","eval("]
def _fill(t,src,exe,d): return [p.replace("{src}",src).replace("{exe}",exe).replace("{dir}",d) for p in t]
async def execute_code(source_code,language,stdin=""):
    lang=language.lower(); config=LANG_CONFIG.get(lang)
    if not config: return {"status":"Error","stdout":"","stderr":f"Language not supported","compile_output":""}
    if lang=="python":
        for b in BLOCKED:
            if b in source_code.lower(): return {"status":"Security Error","stdout":"","stderr":f"Restricted","compile_output":""}
    if lang=="java" and config.get("fix_class"): source_code=re.sub(r"public\s+class\s+\w+","public class Main",source_code)
    tmpdir=tempfile.mkdtemp()
    try:
        fname="Main" if lang=="java" else "solution"; src_path=os.path.join(tmpdir,fname+config["ext"]); exe_path=os.path.join(tmpdir,"sol_bin")
        with open(src_path,"w") as f: f.write(source_code)
        if config["compile"]:
            cmd=_fill(config["compile"],src_path,exe_path,tmpdir)
            try:
                cp=subprocess.run(cmd,capture_output=True,text=True,timeout=15)
                if cp.returncode!=0: return {"status":"Compilation Error","stdout":"","stderr":"","compile_output":cp.stderr or cp.stdout}
            except subprocess.TimeoutExpired: return {"status":"Compilation Timeout","stdout":"","stderr":"Too slow","compile_output":""}
            except FileNotFoundError as e: return {"status":"Runtime Error","stdout":"","stderr":str(e),"compile_output":""}
        run_cmd=_fill(config["run"],src_path,exe_path,tmpdir); t0=time.time()
        try:
            proc=subprocess.run(run_cmd,input=stdin,capture_output=True,text=True,timeout=TIME_LIMIT)
            return {"status":"Accepted" if proc.returncode==0 else "Runtime Error","stdout":proc.stdout,"stderr":proc.stderr,"compile_output":"","time":round(time.time()-t0,3)}
        except subprocess.TimeoutExpired: return {"status":"Time Limit Exceeded","stdout":"","stderr":f"Exceeded {TIME_LIMIT}s","compile_output":"","time":TIME_LIMIT}
        except FileNotFoundError as e: return {"status":"Runtime Error","stdout":"","stderr":str(e),"compile_output":""}
    finally: shutil.rmtree(tmpdir,ignore_errors=True)
async def run_test_cases(source_code,language,test_cases):
    results=[]; passed=0
    for i,tc in enumerate(test_cases):
        result=await execute_code(source_code,language,tc.get("input",""))
        expected=tc.get("expected","").strip(); actual=result.get("stdout","").strip()
        ok=actual==expected and result.get("status")=="Accepted"
        if ok: passed+=1
        results.append({"test_case":i+1,"passed":ok,"input":tc.get("input",""),"expected":expected,"actual":actual,"status":result.get("status"),"time":result.get("time"),"stderr":result.get("stderr","")})
    return {"passed":passed,"total":len(test_cases),"percentage":(passed/len(test_cases)*100) if test_cases else 0,"results":results}
