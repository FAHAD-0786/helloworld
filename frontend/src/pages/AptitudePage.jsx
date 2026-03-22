import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { BookOpen, Clock, ChevronRight, ChevronLeft, Check, AlertCircle, RotateCcw, Loader2, Send, Zap } from 'lucide-react'
import api from '../utils/api'

const CATS = [
  { id:'all',          label:'Mixed',        desc:'Quant + Logical', color:'#818cf8', bg:'rgba(129,140,248,0.12)' },
  { id:'quantitative', label:'Quantitative', desc:'Numbers & Math',  color:'#34d399', bg:'rgba(52,211,153,0.12)'  },
  { id:'logical',      label:'Logical',      desc:'Reasoning',       color:'#a78bfa', bg:'rgba(167,139,250,0.12)' },
]
const DIFF_BADGE = { easy:'badge-easy', medium:'badge-medium', hard:'badge-hard' }

export default function AptitudePage() {
  const [phase,      setPhase]      = useState('setup')
  const [category,   setCategory]   = useState('all')
  const [difficulty, setDiff]       = useState('')
  const [count,      setCount]      = useState(10)
  const [questions,  setQuestions]  = useState([])
  const [current,    setCurrent]    = useState(0)
  const [answers,    setAnswers]    = useState({})
  const [timeLeft,   setTimeLeft]   = useState(0)
  const [startTime,  setStartTime]  = useState(null)
  const [result,     setResult]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const answered = Object.keys(answers).length
  const q = questions[current]

  useEffect(() => {
    if (phase !== 'test' || timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft(s => { if (s<=1) { handleSubmit(); return 0 } return s-1 }), 1000)
    return () => clearInterval(t)
  }, [phase, timeLeft])

  const startTest = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ count })
      if (category !== 'all') p.append('category', category)
      if (difficulty) p.append('difficulty', difficulty)
      const res = await api.get(`/aptitude/questions?${p}`)
      if (!res.data.length) return toast.error('No questions found')
      setQuestions(res.data); setAnswers({}); setCurrent(0)
      setTimeLeft(count * 90); setStartTime(Date.now()); setPhase('test')
    } catch { toast.error('Failed to load questions') }
    finally { setLoading(false) }
  }

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    try {
      const res = await api.post('/aptitude/submit', {
        answers: questions.map(q => ({ question_id: q.id, selected_answer: answers[q.id] || '' })),
        time_taken: timeTaken,
        test_type: category === 'all' ? 'aptitude' : category,
      })
      setResult(res.data); setPhase('result')
    } catch { toast.error('Submission failed') }
    finally { setSubmitting(false) }
  }, [questions, answers, startTime, submitting, category])

  if (phase === 'setup') return (
    <div style={{ maxWidth:600, margin:'0 auto', display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <h2 style={{ fontSize:22, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>Aptitude Test</h2>
        <p style={{ fontSize:13, color:'#6b7a9e', marginTop:4 }}>Practice quantitative and logical reasoning for campus placements</p>
      </div>
      <div className="card" style={{ display:'flex', flexDirection:'column', gap:24 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:'#6b7a9e', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Category</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            {CATS.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                style={{ padding:12, borderRadius:12, border:`1px solid ${category===c.id ? c.color+'60' : '#1e2640'}`, background:category===c.id ? c.bg : '#141929', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>
                <div style={{ fontSize:13, fontWeight:600, color: category===c.id ? c.color : '#e8ecf4' }}>{c.label}</div>
                <div style={{ fontSize:11, color:'#6b7a9e', marginTop:2 }}>{c.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:'#6b7a9e', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Difficulty</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[{id:'',label:'Mixed'},{id:'easy',label:'Easy'},{id:'medium',label:'Medium'},{id:'hard',label:'Hard'}].map(d => (
              <button key={d.id} onClick={() => setDiff(d.id)}
                style={{ padding:'8px 16px', borderRadius:10, border:`1px solid ${difficulty===d.id ? 'rgba(99,102,241,0.5)' : '#1e2640'}`, background:difficulty===d.id ? 'rgba(99,102,241,0.12)' : '#141929', color:difficulty===d.id ? '#818cf8' : '#6b7a9e', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s' }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:'#6b7a9e', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>
            Questions: <span style={{ color:'#818cf8' }}>{count}</span>
            <span style={{ color:'#4a5568', fontWeight:400, textTransform:'none', letterSpacing:0 }}> (~{count * 1.5} min)</span>
          </div>
          <input type="range" min="5" max="20" step="5" value={count} onChange={e => setCount(Number(e.target.value))} style={{ width:'100%', accentColor:'#6366f1' }} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#4a5568', marginTop:4 }}>
            {[5,10,15,20].map(n => <span key={n}>{n}</span>)}
          </div>
        </div>
        <button onClick={startTest} disabled={loading} className="btn-primary" style={{ width:'100%' }}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
          {loading ? 'Loading…' : `Start Test (${count} Questions)`}
        </button>
      </div>
    </div>
  )

  if (phase === 'test' && q) return (
    <div style={{ maxWidth:640, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:13, color:'#6b7a9e' }}>
          Q <span style={{ color:'white', fontWeight:700 }}>{current+1}</span> / {questions.length}
          <span style={{ marginLeft:8, color:'#4a5568' }}>({answered} answered)</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:10, background:timeLeft<60?'rgba(244,63,94,0.1)':'#141929', border:`1px solid ${timeLeft<60?'rgba(244,63,94,0.3)':'#1e2640'}`, fontSize:13, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:timeLeft<60?'#fb7185':'white' }}>
          <Clock size={12} /> {fmt(timeLeft)}
        </div>
      </div>

      <div style={{ height:4, borderRadius:999, background:'#1e2640', overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:999, background:'linear-gradient(90deg,#6366f1,#8b5cf6)', transition:'width 0.3s', width:`${(answered/questions.length)*100}%` }} />
      </div>

      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <span className={DIFF_BADGE[q.difficulty]||'badge-blue'}>{q.difficulty}</span>
          <span style={{ fontSize:11, color:'#6b7a9e', textTransform:'capitalize' }}>{q.category}</span>
        </div>
        <p style={{ fontSize:15, fontWeight:500, color:'white', lineHeight:1.65 }}>{q.question_text}</p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {q.options?.map((opt, i) => {
          const sel = answers[q.id] === opt
          return (
            <motion.button key={opt} whileTap={{ scale:0.99 }} onClick={() => setAnswers(a => ({...a, [q.id]:opt}))}
              style={{ padding:16, borderRadius:14, border:`1px solid ${sel?'rgba(99,102,241,0.5)':'#1e2640'}`, background:sel?'rgba(99,102,241,0.1)':'#141929', color:sel?'#a5b4fc':'#e8ecf4', cursor:'pointer', textAlign:'left', fontSize:14, fontWeight:500, fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s', display:'flex', alignItems:'center' }}>
              <span style={{ width:26, height:26, borderRadius:8, display:'inline-flex', alignItems:'center', justifyContent:'center', marginRight:12, fontSize:12, fontWeight:700, flexShrink:0, background:sel?'#6366f1':'#1e2640', color:'white' }}>
                {String.fromCharCode(65+i)}
              </span>
              {opt}
            </motion.button>
          )
        })}
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
        <button onClick={() => setCurrent(c => Math.max(0,c-1))} disabled={current===0} className="btn-secondary" style={{ opacity:current===0?0.4:1 }}>
          <ChevronLeft size={14} /> Prev
        </button>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', justifyContent:'center', flex:1 }}>
          {questions.map((_,i) => (
            <button key={i} onClick={() => setCurrent(i)}
              style={{ width:28, height:28, borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', border:`1px solid ${i===current?'#6366f1':answers[questions[i]?.id]?'rgba(99,102,241,0.3)':'#1e2640'}`, background:i===current?'#6366f1':answers[questions[i]?.id]?'rgba(99,102,241,0.1)':'#141929', color:i===current?'white':answers[questions[i]?.id]?'#818cf8':'#6b7a9e', fontFamily:"'DM Sans',sans-serif" }}>
              {i+1}
            </button>
          ))}
        </div>
        {current < questions.length-1
          ? <button onClick={() => setCurrent(c=>c+1)} className="btn-primary">Next <ChevronRight size={14} /></button>
          : <button onClick={handleSubmit} disabled={submitting} className="btn-success">
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Submit
            </button>
        }
      </div>
    </div>
  )

  if (phase === 'result' && result) return (
    <div style={{ maxWidth:640, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} className="card" style={{ textAlign:'center', padding:32 }}>
        <div style={{ width:112, height:112, borderRadius:'50%', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontWeight:700, fontFamily:"'Sora',sans-serif", border:`4px solid ${result.percentage>=70?'#10b981':result.percentage>=50?'#f59e0b':'#f43f5e'}`, color:result.percentage>=70?'#34d399':result.percentage>=50?'#fbbf24':'#fb7185' }}>
          {result.percentage?.toFixed(0)}%
        </div>
        <h3 style={{ fontSize:20, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif", marginBottom:12 }}>
          {result.percentage>=70 ? '🎉 Excellent!' : result.percentage>=50 ? '👍 Good Effort!' : '📚 Keep Practicing!'}
        </h3>
        {result.xp_earned > 0 && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:999, background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)', fontSize:13, fontWeight:600, color:'#818cf8', marginBottom:12 }}>
            <Zap size={12} /> +{result.xp_earned} XP earned!
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'center', gap:32, marginTop:8 }}>
          <div><div style={{ fontSize:22, fontWeight:700, color:'#34d399', fontFamily:"'Sora',sans-serif" }}>{result.correct}</div><div style={{ fontSize:12, color:'#6b7a9e' }}>Correct</div></div>
          <div><div style={{ fontSize:22, fontWeight:700, color:'#fb7185', fontFamily:"'Sora',sans-serif" }}>{result.wrong}</div><div style={{ fontSize:12, color:'#6b7a9e' }}>Wrong</div></div>
          <div><div style={{ fontSize:22, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>{Math.floor(result.time_taken/60)}m {result.time_taken%60}s</div><div style={{ fontSize:12, color:'#6b7a9e' }}>Time</div></div>
        </div>
      </motion.div>

      {result.feedback && (
        <div className="card" style={{ borderLeft:'3px solid #6366f1' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#818cf8', marginBottom:8 }}>🤖 AI Feedback</div>
          <p style={{ fontSize:13, lineHeight:1.7, color:'#e8ecf4', whiteSpace:'pre-line' }}>{result.feedback}</p>
        </div>
      )}

      <div className="card">
        <div style={{ fontSize:13, fontWeight:700, color:'white', marginBottom:16 }}>Answer Review</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:380, overflowY:'auto' }}>
          {result.detailed_answers?.map((a, i) => (
            <div key={i} style={{ padding:12, borderRadius:12, background:a.is_correct?'rgba(16,185,129,0.06)':'rgba(244,63,94,0.06)', border:`1px solid ${a.is_correct?'rgba(16,185,129,0.2)':'rgba(244,63,94,0.2)'}` }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                {a.is_correct ? <Check size={12} color="#34d399" style={{ flexShrink:0, marginTop:2 }} /> : <AlertCircle size={12} color="#fb7185" style={{ flexShrink:0, marginTop:2 }} />}
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:'#e8ecf4', lineHeight:1.5 }}>{a.question_text}</div>
                  {!a.is_correct && (
                    <div style={{ fontSize:11, marginTop:4, color:'#6b7a9e' }}>
                      Your: <span style={{ color:'#fb7185' }}>{a.selected||'Not answered'}</span>
                      {' · '}Correct: <span style={{ color:'#34d399' }}>{a.correct}</span>
                    </div>
                  )}
                  {a.explanation && !a.is_correct && <div style={{ fontSize:11, color:'#4a5568', marginTop:4 }}>{a.explanation}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => setPhase('setup')} className="btn-secondary"><RotateCcw size={13} /> Try Again</button>
    </div>
  )
}
