import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Code2, Play, Send, ChevronLeft, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import api from '../utils/api'

const LANGS = [
  { id:'python',     label:'Python 3'   },
  { id:'javascript', label:'JavaScript' },
  { id:'java',       label:'Java'       },
  { id:'cpp',        label:'C++'        },
  { id:'c',          label:'C'          },
]
const DIFF_BADGE = { easy:'badge-easy', medium:'badge-medium', hard:'badge-hard' }

export default function CodingPage() {
  const [questions,  setQuestions]  = useState([])
  const [selected,   setSelected]   = useState(null)
  const [code,       setCode]       = useState('')
  const [lang,       setLang]       = useState('python')
  const [stdin,      setStdin]      = useState('')
  const [running,    setRunning]    = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [runOut,     setRunOut]     = useState(null)
  const [submitOut,  setSubmitOut]  = useState(null)
  const [elapsed,    setElapsed]    = useState(0)
  const timerRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    api.get('/coding/questions').then(r => setQuestions(r.data)).catch(console.error)
  }, [])

  useEffect(() => {
    if (!selected) return
    clearInterval(timerRef.current)
    startRef.current = Date.now()
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now()-startRef.current)/1000)), 1000)
    return () => clearInterval(timerRef.current)
  }, [selected])

  const pick = q => { setSelected(q); setCode(q.starter_code||'# Write your solution here\n'); setRunOut(null); setSubmitOut(null); setStdin(''); setElapsed(0) }
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const qTitle = q => {
    const h = q.question_text.split('\n').find(l => l.startsWith('## '))
    return h ? h.replace('## ','') : `Problem #${q.id}`
  }

  const runCode = async () => {
    setRunning(true); setRunOut(null)
    try { const r = await api.post('/coding/run', { source_code:code, language:lang, stdin }); setRunOut(r.data) }
    catch { toast.error('Run failed') }
    finally { setRunning(false) }
  }

  const submitCode = async () => {
    if (!selected) return
    setSubmitting(true); setSubmitOut(null)
    try {
      const r = await api.post('/coding/submit', { question_id:selected.id, source_code:code, language:lang, time_taken:elapsed })
      setSubmitOut(r.data)
      if (r.data.percentage === 100) toast.success('All test cases passed! 🎉')
      else toast(`Passed ${r.data.passed}/${r.data.total} test cases`)
    } catch { toast.error('Submission failed') }
    finally { setSubmitting(false) }
  }

  return (
    <div style={{ display:'flex', gap:16, height:'calc(100vh - 7rem)' }}>
      {/* Question list */}
      <div style={{ width:240, flexShrink:0, display:'flex', flexDirection:'column', gap:8, overflowY:'auto' }} className={selected ? 'hidden lg:flex' : 'flex'}>
        <div style={{ fontSize:14, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif", marginBottom:4 }}>Coding Problems</div>
        {questions.map(q => (
          <button key={q.id} onClick={() => pick(q)}
            style={{ textAlign:'left', padding:12, borderRadius:12, border:`1px solid ${selected?.id===q.id?'#6366f1':'#1e2640'}`, background:selected?.id===q.id?'rgba(99,102,241,0.1)':'#0e1320', cursor:'pointer', transition:'all 0.2s' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <span className={DIFF_BADGE[q.difficulty]||'badge-blue'}>{q.difficulty}</span>
              {submitOut && selected?.id===q.id && (submitOut.percentage===100 ? <CheckCircle size={12} color="#34d399" /> : <XCircle size={12} color="#fb7185" />)}
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{qTitle(q)}</div>
            <div style={{ display:'flex', gap:4, marginTop:6, flexWrap:'wrap' }}>
              {q.tags?.slice(0,3).map(t => <span key={t} style={{ fontSize:10, color:'#4a5568', background:'#1e2640', padding:'2px 6px', borderRadius:4 }}>{t}</span>)}
            </div>
          </button>
        ))}
      </div>

      {/* Editor */}
      {selected ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10, minWidth:0 }}>
          {/* Problem statement */}
          <div className="card" style={{ flexShrink:0, maxHeight:160, overflowY:'auto', padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7a9e', display:'flex' }} className="lg:hidden"><ChevronLeft size={15} /></button>
                <span className={DIFF_BADGE[selected.difficulty]||'badge-blue'}>{selected.difficulty}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#6b7a9e', fontFamily:"'JetBrains Mono',monospace" }}>
                <Clock size={12} /> {fmt(elapsed)}
              </div>
            </div>
            <div style={{ fontSize:13, color:'#e8ecf4', lineHeight:1.65, whiteSpace:'pre-wrap' }}>{selected.question_text}</div>
          </div>

          {/* Toolbar */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <select value={lang} onChange={e => setLang(e.target.value)} className="input" style={{ width:140, padding:'8px 12px', fontSize:13 }}>
              {LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <div style={{ flex:1 }} />
            <button onClick={runCode} disabled={running} className="btn-secondary" style={{ padding:'8px 16px', fontSize:13 }}>
              {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} Run
            </button>
            <button onClick={submitCode} disabled={submitting} className="btn-primary" style={{ padding:'8px 16px', fontSize:13 }}>
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Submit
            </button>
          </div>

          {/* Monaco editor */}
          <div style={{ flex:1, borderRadius:14, overflow:'hidden', border:'1px solid #1e2640', minHeight:0 }}>
            <Editor height="100%" language={lang==='cpp'?'cpp':lang} value={code} onChange={v => setCode(v||'')} theme="vs-dark"
              options={{ fontSize:14, minimap:{enabled:false}, lineNumbers:'on', scrollBeyondLastLine:false, automaticLayout:true, fontFamily:"'JetBrains Mono',monospace", padding:{top:10} }} />
          </div>

          {/* I/O */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, flexShrink:0 }}>
            <div>
              <div style={{ fontSize:11, color:'#6b7a9e', marginBottom:6 }}>Custom Input</div>
              <textarea value={stdin} onChange={e => setStdin(e.target.value)} rows={3} placeholder="stdin…" className="input" style={{ resize:'none', fontFamily:"'JetBrains Mono',monospace", fontSize:12 }} />
            </div>
            <div>
              <div style={{ fontSize:11, color:'#6b7a9e', marginBottom:6 }}>Output</div>
              <div style={{ background:'#141929', border:'1px solid #1e2640', borderRadius:12, padding:10, height:80, overflowY:'auto', fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>
                {running ? <span style={{ color:'#6b7a9e' }}>Running…</span>
                  : runOut ? <span style={{ color:runOut.status==='Accepted'?'#34d399':'#fb7185' }}>{runOut.stdout||runOut.stderr||runOut.compile_output||runOut.status}</span>
                  : <span style={{ color:'#4a5568' }}>Output appears after Run</span>}
              </div>
            </div>
          </div>

          {/* Submit results */}
          {submitOut && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="card" style={{ flexShrink:0, padding:14, border:`1px solid ${submitOut.percentage===100?'rgba(16,185,129,0.3)':'rgba(244,63,94,0.3)'}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                {submitOut.percentage===100 ? <CheckCircle size={15} color="#34d399" /> : <XCircle size={15} color="#fb7185" />}
                <span style={{ fontSize:13, fontWeight:600, color:'white' }}>
                  {submitOut.passed}/{submitOut.total} test cases passed ({submitOut.percentage?.toFixed(0)}%)
                </span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {submitOut.test_results?.map((tc, i) => (
                  <div key={i} style={{ fontSize:11, padding:'6px 10px', borderRadius:8, border:`1px solid ${tc.passed?'rgba(16,185,129,0.25)':'rgba(244,63,94,0.25)'}`, background:tc.passed?'rgba(16,185,129,0.06)':'rgba(244,63,94,0.06)', color:tc.passed?'#34d399':'#fb7185' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:4, fontWeight:600 }}>
                      {tc.passed ? <CheckCircle size={9} /> : <XCircle size={9} />} Test {tc.test_case}
                    </div>
                    {!tc.passed && <div style={{ color:'#6b7a9e', marginTop:3 }}>{tc.stderr||tc.compile_output ? (tc.stderr||tc.compile_output).slice(0,60) : `Got: "${tc.actual}" · Expected: "${tc.expected}"`}</div>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="hidden lg:flex" style={{ flex:1, alignItems:'center', justifyContent:'center', color:'#4a5568', flexDirection:'column', gap:12 }}>
          <Code2 size={48} style={{ opacity:0.2 }} />
          <p>Select a problem to start coding</p>
        </div>
      )}
    </div>
  )
}
