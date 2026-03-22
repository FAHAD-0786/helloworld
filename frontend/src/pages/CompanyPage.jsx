import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Building2, ChevronRight, ChevronLeft, Check, AlertCircle, RotateCcw, Send, Clock, Loader2 } from 'lucide-react'
import api from '../utils/api'

const DIFF_BADGE = { easy:'badge-easy', medium:'badge-medium', hard:'badge-hard' }

export default function CompanyPage() {
  const [phase,      setPhase]      = useState('select')
  const [companies,  setCompanies]  = useState([])
  const [selected,   setSelected]   = useState(null)
  const [category,   setCategory]   = useState('all')
  const [questions,  setQuestions]  = useState([])
  const [current,    setCurrent]    = useState(0)
  const [answers,    setAnswers]    = useState({})
  const [timeLeft,   setTimeLeft]   = useState(0)
  const [startTime,  setStartTime]  = useState(null)
  const [result,     setResult]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get('/company/list').then(r => setCompanies(r.data)).catch(console.error)
  }, [])

  useEffect(() => {
    if (phase !== 'test' || timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft(s => { if(s<=1){handleSubmit();return 0} return s-1 }), 1000)
    return () => clearInterval(t)
  }, [phase, timeLeft])

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const answered = Object.keys(answers).length
  const q = questions[current]

  const startTest = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const params = category !== 'all' ? `?category=${category}&count=15` : '?count=15'
      const r = await api.get(`/company/${selected.id}/questions${params}`)
      if (!r.data.length) return toast.error('No questions for this company yet')
      setQuestions(r.data); setAnswers({}); setCurrent(0)
      setTimeLeft(r.data.length * 90); setStartTime(Date.now()); setPhase('test')
    } catch { toast.error('Failed to load questions') }
    finally { setLoading(false) }
  }

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    const timeTaken = Math.floor((Date.now()-startTime)/1000)
    try {
      const r = await api.post('/company/submit', {
        answers: questions.map(q => ({ question_id:q.id, selected_answer:answers[q.id]||'' })),
        company: selected.id, time_taken: timeTaken,
      })
      setResult(r.data); setPhase('result')
    } catch { toast.error('Submission failed') }
    finally { setSubmitting(false) }
  }, [questions, answers, startTime, submitting, selected])

  if (phase === 'select') return (
    <div style={{ maxWidth:800, margin:'0 auto', display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <h2 style={{ fontSize:22, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>Company Interview Prep</h2>
        <p style={{ fontSize:13, color:'#6b7a9e', marginTop:4 }}>Practice real questions from top placement companies</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {companies.map(c => (
          <motion.button key={c.id} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
            onClick={() => setSelected(s => s?.id===c.id ? null : c)}
            className="card" style={{ textAlign:'left', border:`1px solid ${selected?.id===c.id?c.color+'50':'#1e2640'}`, background:selected?.id===c.id?`${c.color}10`:'#0e1320', cursor:'pointer', transition:'all 0.2s', padding:16 }}>
            <div style={{ width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, color:'white', marginBottom:12, background:c.color }}>
              {c.logo}
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:'white' }}>{c.name}</div>
            <div style={{ fontSize:11, color:'#6b7a9e', marginTop:2 }}>{c.question_count} questions</div>
          </motion.button>
        ))}
      </div>

      {selected && (
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="card" style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15, color:'white', background:selected.color }}>{selected.logo}</div>
            <div style={{ fontSize:15, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>{selected.full_name} Mock Interview</div>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#6b7a9e', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Category</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['all','quantitative','logical'].map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  style={{ padding:'7px 14px', borderRadius:10, border:`1px solid ${category===c?'rgba(99,102,241,0.5)':'#1e2640'}`, background:category===c?'rgba(99,102,241,0.12)':'#141929', color:category===c?'#818cf8':'#6b7a9e', fontSize:12, fontWeight:500, cursor:'pointer', textTransform:'capitalize', fontFamily:"'DM Sans',sans-serif" }}>
                  {c === 'all' ? 'All Topics' : c}
                </button>
              ))}
            </div>
          </div>
          <button onClick={startTest} disabled={loading} className="btn-primary" style={{ width:'100%' }}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Building2 size={13} />}
            Start {selected.name} Mock Test
          </button>
        </motion.div>
      )}
    </div>
  )

  if (phase === 'test' && q) return (
    <div style={{ maxWidth:640, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:13, color:'#6b7a9e' }}>Q <span style={{ color:'white', fontWeight:700 }}>{current+1}</span>/{questions.length}</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:10, background:'#141929', border:'1px solid #1e2640', fontSize:13, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:'white' }}>
          <Clock size={12} /> {fmt(timeLeft)}
        </div>
      </div>
      <div style={{ height:4, borderRadius:999, background:'#1e2640', overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:999, background:'linear-gradient(90deg,#6366f1,#8b5cf6)', transition:'width 0.3s', width:`${(answered/questions.length)*100}%` }} />
      </div>
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <span className={DIFF_BADGE[q.difficulty]||'badge-blue'}>{q.difficulty}</span>
          <span style={{ fontSize:11, color:'#6b7a9e', textTransform:'capitalize' }}>{q.category}</span>
          {q.year && <span style={{ fontSize:11, color:'#4a5568' }}>· {q.year}</span>}
        </div>
        <p style={{ fontSize:15, fontWeight:500, color:'white', lineHeight:1.65 }}>{q.question_text}</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {q.options?.map((opt, i) => {
          const sel = answers[q.id] === opt
          return (
            <motion.button key={opt} whileTap={{ scale:0.99 }} onClick={() => setAnswers(a => ({...a,[q.id]:opt}))}
              style={{ padding:14, borderRadius:12, border:`1px solid ${sel?'rgba(99,102,241,0.5)':'#1e2640'}`, background:sel?'rgba(99,102,241,0.1)':'#141929', color:sel?'#a5b4fc':'#e8ecf4', cursor:'pointer', textAlign:'left', fontSize:14, fontWeight:500, fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s', display:'flex', alignItems:'center' }}>
              <span style={{ width:24,height:24,borderRadius:7,display:'inline-flex',alignItems:'center',justifyContent:'center',marginRight:10,fontSize:11,fontWeight:700,flexShrink:0,background:sel?'#6366f1':'#1e2640',color:'white' }}>{String.fromCharCode(65+i)}</span>
              {opt}
            </motion.button>
          )
        })}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
        <button onClick={() => setCurrent(c=>Math.max(0,c-1))} disabled={current===0} className="btn-secondary" style={{ opacity:current===0?0.4:1 }}><ChevronLeft size={14} /> Prev</button>
        <div style={{ display:'flex', gap:4, flex:1, justifyContent:'center', flexWrap:'wrap' }}>
          {questions.map((_,i) => (
            <button key={i} onClick={() => setCurrent(i)}
              style={{ width:26,height:26,borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',border:`1px solid ${i===current?'#6366f1':answers[questions[i]?.id]?'rgba(99,102,241,0.3)':'#1e2640'}`,background:i===current?'#6366f1':answers[questions[i]?.id]?'rgba(99,102,241,0.1)':'#141929',color:i===current?'white':answers[questions[i]?.id]?'#818cf8':'#6b7a9e',fontFamily:"'DM Sans',sans-serif" }}>
              {i+1}
            </button>
          ))}
        </div>
        {current<questions.length-1
          ? <button onClick={() => setCurrent(c=>c+1)} className="btn-primary">Next <ChevronRight size={14} /></button>
          : <button onClick={handleSubmit} disabled={submitting} className="btn-success">{submitting?<Loader2 size={13} className="animate-spin"/>:<Send size={13}/>} Submit</button>
        }
      </div>
    </div>
  )

  if (phase === 'result' && result) return (
    <div style={{ maxWidth:640, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} className="card" style={{ textAlign:'center', padding:28 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:16 }}>
          <div style={{ width:44,height:44,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:20,color:'white',background:selected?.color }}>{selected?.logo}</div>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:16, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>{selected?.name} Mock Test</div>
            <div style={{ fontSize:12, color:'#6b7a9e' }}>Complete</div>
          </div>
        </div>
        <div style={{ width:100,height:100,borderRadius:'50%',margin:'0 auto 12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,fontWeight:700,fontFamily:"'Sora',sans-serif",border:`4px solid ${result.percentage>=70?'#10b981':result.percentage>=50?'#f59e0b':'#f43f5e'}`,color:result.percentage>=70?'#34d399':result.percentage>=50?'#fbbf24':'#fb7185' }}>
          {result.percentage?.toFixed(0)}%
        </div>
        <div style={{ fontSize:16, fontWeight:600, color:result.percentage>=70?'#34d399':result.percentage>=50?'#fbbf24':'#fb7185', fontFamily:"'Sora',sans-serif" }}>
          {result.percentage>=70?'🎉 Interview Ready!':result.percentage>=50?'👍 Getting there!':'📚 Need more practice'}
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:32, marginTop:16 }}>
          <div><div style={{ fontSize:20,fontWeight:700,color:'#34d399',fontFamily:"'Sora',sans-serif" }}>{result.correct}</div><div style={{ fontSize:11,color:'#6b7a9e' }}>Correct</div></div>
          <div><div style={{ fontSize:20,fontWeight:700,color:'#fb7185',fontFamily:"'Sora',sans-serif" }}>{result.wrong}</div><div style={{ fontSize:11,color:'#6b7a9e' }}>Wrong</div></div>
        </div>
      </motion.div>
      <div className="card">
        <div style={{ fontSize:13,fontWeight:700,color:'white',marginBottom:12 }}>Answer Review</div>
        <div style={{ display:'flex',flexDirection:'column',gap:8,maxHeight:320,overflowY:'auto' }}>
          {result.detailed_answers?.map((a,i) => (
            <div key={i} style={{ padding:10,borderRadius:10,background:a.is_correct?'rgba(16,185,129,0.06)':'rgba(244,63,94,0.06)',border:`1px solid ${a.is_correct?'rgba(16,185,129,0.15)':'rgba(244,63,94,0.15)'}` }}>
              <div style={{ display:'flex',alignItems:'flex-start',gap:8 }}>
                {a.is_correct?<Check size={11} color="#34d399" style={{ flexShrink:0,marginTop:2 }}/>:<AlertCircle size={11} color="#fb7185" style={{ flexShrink:0,marginTop:2 }}/>}
                <div>
                  <div style={{ fontSize:12,color:'#e8ecf4',lineHeight:1.5 }}>{a.question_text}</div>
                  {!a.is_correct&&<div style={{ fontSize:11,marginTop:3,color:'#6b7a9e' }}>Your: <span style={{ color:'#fb7185' }}>{a.selected||'—'}</span> · Correct: <span style={{ color:'#34d399' }}>{a.correct}</span></div>}
                  {a.explanation&&!a.is_correct&&<div style={{ fontSize:11,color:'#4a5568',marginTop:3 }}>{a.explanation}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => { setPhase('select'); setResult(null) }} className="btn-secondary"><RotateCcw size={13} /> Try Another Company</button>
    </div>
  )
}
