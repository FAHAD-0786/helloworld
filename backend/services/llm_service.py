import os, httpx
from dotenv import load_dotenv
load_dotenv()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL","http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL","llama3.2")
TIPS = {"tcs":"TCS NQT: Focus on aptitude (speed-distance, percentages) and basic Python/C++ coding.","infosys":"Infosys: Strong logical reasoning. Practice seating arrangements and blood relations.","wipro":"Wipro NLTH: Verbal + quantitative + coding. Practice sentence completion.","zoho":"Zoho: Heavy coding round. Master arrays, strings, sorting, searching.","accenture":"Accenture: Cognitive + technical + coding. Focus on communication and English.","percentage":"Percentage: x% of y = yx/100. Increase then decrease = net negative.","profit":"Profit% = (SP-CP)/CPx100. SP = CPx(1+P/100).","speed":"Speed = Distance/Time. Upstream = speed-stream. Downstream = speed+stream.","interest":"SI=PRT/100. CI=P[(1+r)^n-1]. CI > SI always.","fibonacci":"Fibonacci: f(n)=f(n-1)+f(n-2). DP: O(n) time.","binary":"Binary Search: sorted array. Compare mid. O(log n).","array":"Arrays: access O(1), search O(n). Use hashmap for O(1) lookup.",}
def is_ollama_running():
    try: return httpx.get(f"{OLLAMA_BASE_URL}/api/tags",timeout=2.0).status_code==200
    except: return False
def ollama_chat(prompt):
    try:
        r = httpx.post(f"{OLLAMA_BASE_URL}/api/generate",json={"model":OLLAMA_MODEL,"prompt":prompt,"stream":False},timeout=30.0)
        return r.json().get("response","").strip() if r.status_code==200 else ""
    except: return ""
def smart_fallback(message):
    msg=message.lower()
    for k,v in TIPS.items():
        if k in msg: return f"💡 {v}\n\n*(Run `ollama serve` locally for full AI)*"
    if any(w in msg for w in ["aptitude","quant","logical","formula"]): return "📚 Aptitude Tips:\n• Practice 20 questions daily\n• Key: percentages, profit-loss, time-work, ratios\n• Target 90 seconds per question"
    if any(w in msg for w in ["coding","code","python","java","array","algorithm"]): return "💻 Coding Tips:\n• Master: arrays, strings, recursion, sorting\n• Know time complexity: O(1), O(n), O(log n)\n• Practice on the Coding page!"
    if any(w in msg for w in ["communication","speak","voice","hr","interview","filler"]): return "🎤 Communication Tips:\n• Target 120-150 words per minute\n• Avoid: um, uh, like, basically\n• Use STAR method for behavioral questions"
    return "👋 I am PlacePro AI in offline mode.\n\nAsk about:\n• Aptitude formulas\n• Coding concepts\n• Company prep (TCS, Infosys etc.)\n\nRun `ollama serve` for full AI."
async def chat_with_assistant(message, session_id):
    if not is_ollama_running(): return smart_fallback(message)
    reply = ollama_chat(f"You are a placement assistant for Indian students. Be concise, max 150 words.\nStudent: {message}\nAI:")
    return reply or smart_fallback(message)
async def generate_test_feedback(test_type, score, max_score, percentage, time_taken, wrong_answers):
    if percentage>=80: return f"Excellent! {percentage:.0f}% - Placement ready!"
    if percentage>=60: return f"Good effort! {percentage:.0f}% - Review weak areas and retry."
    return f"Keep going! {percentage:.0f}% - Practice the topics you missed daily!"
async def analyze_communication(topic, transcript, wpm, filler_words, duration):
    word_count=len(transcript.split()) if transcript else 0
    fs=min(10,max(0,10-abs(wpm-140)/20)) if wpm>0 else 3
    fs=max(0,fs-min(4,len(filler_words)*0.5))
    vs=min(10,word_count/25)
    overall=round((fs+vs)/2,2)
    pace="Good pace! " if 120<=wpm<=150 else ("Speak faster. " if wpm<120 else "Slow down. ")
    fillers="No fillers - great!" if not filler_words else f"Reduce fillers ({len(filler_words)} found)."
    return {"fluency_score":round(fs,2),"vocabulary_score":round(vs,2),"overall_score":overall,"feedback":f"WPM:{wpm:.0f}. {pace}{fillers} Score:{overall:.1f}/10."}
