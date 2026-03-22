import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Mic, Square, Send, RotateCcw, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import api from '../utils/api'

const FILLERS = ['um','uh','er','ah','like','you know','basically','actually','literally','so basically','right','okay so']

export default function CommunicationPage() {
  const [phase,       setPhase]       = useState('setup')
  const [topics,      setTopics]      = useState([])
  const [topic,       setTopic]       = useState('')
  const [custom,      setCustom]      = useState('')
  const [recording,   setRecording]   = useState(false)
  const [transcript,  setTranscript]  = useState('')
  const [interim,     setInterim]     = useState('')
  const [duration,    setDuration]    = useState(0)
  const [wpm,         setWpm]         = useState(0)
  const [fillerCount, setFillerCount] = useState(0)
  const [result,      setResult]      = useState(null)
  const [submitting,  setSubmitting]  = useState(false)
  const recRef   = useRef(null)
  const timerRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    api.get('/communication/topics').then(r => setTopics(r.data.topics)).catch(console.error)
    return () => { recRef.current?.stop(); clearInterval(timerRef.current) }
  }, [])

  const activeTopic = topic === 'custom' ? custom : topic
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const startRec = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return toast.error('Use Chrome browser for speech recognition')
    const rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = 'en-IN'
    rec.onresult = event => {
      let fin='', itr=''
      for (let i=event.resultIndex;i<event.results.length;i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) fin += t+' '; else itr += t
      }
      if (fin) {
        setTranscript(prev => {
          const updated = prev+fin
          const wc = updated.trim().split(/\s+/).length
          const mins = (Date.now()-startRef.current)/60000
          setWpm(mins>0?Math.round(wc/mins):0)
          const lower = updated.toLowerCase()
          let cnt=0; FILLERS.forEach(f => { const m=lower.match(new RegExp(`\\b${f}\\b`,'g')); cnt+=m?.length||0 }); setFillerCount(cnt)
          return updated
        })
      }
      setInterim(itr)
    }
    rec.onerror = e => { if(e.error!=='aborted') toast.error(`Mic error: ${e.error}`) }
    recRef.current = rec; startRef.current = Date.now()
    rec.start(); setRecording(true); setPhase('recording')
    setTranscript(''); setInterim(''); setWpm(0); setFillerCount(0); setDuration(0)
    timerRef.current = setInterval(() => setDuration(d => d+1), 1000)
  }

  const stopRec = () => {
    recRef.current?.stop(); clearInterval(timerRef.current); setRecording(false); setInterim('')
    if (transcript.trim()) setPhase('review'); else toast.error('No speech detected. Try again.')
  }

  const analyze = async () => {
    if (!transcript.trim()) return toast.error('No transcript')
    setSubmitting(true)
    try {
      const r = await api.post('/communication/analyze', { transcript, topic: activeTopic||'General', duration_seconds:duration, words_per_minute:wpm })
      setResult(r.data); setPhase('result')
    } catch { toast.error('Analysis failed') }
    finally { setSubmitting(false) }
  }

  const reset = () => { setPhase('setup'); setTranscript(''); setResult(null); setDuration(0); setWpm(0); setFillerCount(0) }
  const wpmColor = wpm===0?'#6b7a9e':wpm<100?'#fbbf24':wpm<=160?'#34d399':'#fb7185'
  const fillerColor = fillerCount===0?'#34d399':fillerCount<=3?'#fbbf24':'#fb7185'

  if (phase === 'setup') return (
    <div style={{ maxWidth:560, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h2 style={{ fontSize:22, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>Voice Fluency Test</h2>
        <p style={{ fontSize:13, color:'#6b7a9e', marginTop:4 }}>Speak on a topic and get AI feedback on your fluency and vocabulary</p>
      </div>
      <div className="card" style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:'#6b7a9e', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Choose a Topic</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {topics.map(t => (
              <button key={t} onClick={() => setTopic(t)}
                style={{ textAlign:'left', padding:12, borderRadius:10, border:`1px solid ${topic===t?'rgba(139,92,246,0.5)':'#1e2640'}`, background:topic===t?'rgba(139,92,246,0.1)':'#141929', color:topic===t?'#c4b5fd':'#6b7a9e', fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s' }}>
                {t}
              </button>
            ))}
            <button onClick={() => setTopic('custom')}
              style={{ textAlign:'left', padding:12, borderRadius:10, border:`1px solid ${topic==='custom'?'rgba(139,92,246,0.5)':'#1e2640'}`, background:topic==='custom'?'rgba(139,92,246,0.1)':'#141929', color:topic==='custom'?'#c4b5fd':'#6b7a9e', fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              ✏️ Custom topic…
            </button>
            {topic === 'custom' && (
              <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Enter your topic here…" className="input" />
            )}
          </div>
        </div>
        <div style={{ padding:14, borderRadius:12, background:'#141929', border:'1px solid #1e2640', fontSize:13, color:'#6b7a9e', lineHeight:1.7 }}>
          <div style={{ fontWeight:600, color:'white', marginBottom:6, fontSize:13 }}>💡 Tips</div>
          <div>• Speak clearly at 120–150 words per minute</div>
          <div>• Avoid: "um", "uh", "like", "basically"</div>
          <div>• Speak for at least 1–2 minutes</div>
          <div>• Use <strong style={{ color:'white' }}>Chrome</strong> browser for best results</div>
        </div>
        <button onClick={startRec} disabled={!topic||(topic==='custom'&&!custom.trim())} className="btn-primary" style={{ width:'100%', background:'#7c3aed' }}
          onMouseEnter={e => e.currentTarget.style.background='#8b5cf6'} onMouseLeave={e => e.currentTarget.style.background='#7c3aed'}>
          <Mic size={15} /> Start Recording
        </button>
      </div>
    </div>
  )

  if (phase === 'recording') return (
    <div style={{ maxWidth:560, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>
      <div className="card" style={{ textAlign:'center', padding:32 }}>
        <div style={{ fontSize:13, color:'#6b7a9e', marginBottom:6 }}>Speaking about:</div>
        <div style={{ fontSize:16, fontWeight:600, color:'white', marginBottom:28 }}>"{activeTopic}"</div>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
          <button onClick={stopRec} className="recording-pulse" style={{ width:88, height:88, borderRadius:'50%', background:'#dc2626', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Square size={28} color="white" />
          </button>
        </div>
        <div style={{ fontSize:32, fontWeight:700, color:'white', fontFamily:"'JetBrains Mono',monospace" }}>{fmt(duration)}</div>
        <div style={{ fontSize:12, color:'#6b7a9e', marginTop:4 }}>Tap to stop</div>
        <div style={{ display:'flex', justifyContent:'center', gap:40, marginTop:24 }}>
          <div style={{ textAlign:'center' }}><div style={{ fontSize:24, fontWeight:700, color:wpmColor, fontFamily:"'Sora',sans-serif" }}>{wpm}</div><div style={{ fontSize:11, color:'#6b7a9e' }}>WPM</div></div>
          <div style={{ textAlign:'center' }}><div style={{ fontSize:24, fontWeight:700, color:fillerColor, fontFamily:"'Sora',sans-serif" }}>{fillerCount}</div><div style={{ fontSize:11, color:'#6b7a9e' }}>Fillers</div></div>
          <div style={{ textAlign:'center' }}><div style={{ fontSize:24, fontWeight:700, color:'#e8ecf4', fontFamily:"'Sora',sans-serif" }}>{transcript.trim().split(/\s+/).filter(Boolean).length}</div><div style={{ fontSize:11, color:'#6b7a9e' }}>Words</div></div>
        </div>
      </div>
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:600, color:'#6b7a9e', marginBottom:10 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#dc2626', animation:'pulse 2s infinite' }} /> Live Transcript
        </div>
        <p style={{ fontSize:13, color:'#e8ecf4', lineHeight:1.65, minHeight:80 }}>
          {transcript}<span style={{ color:'#4a5568', fontStyle:'italic' }}>{interim}</span>
          {!transcript&&!interim&&<span style={{ color:'#4a5568', fontStyle:'italic' }}>Start speaking…</span>}
        </p>
      </div>
    </div>
  )

  if (phase === 'review') return (
    <div style={{ maxWidth:560, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>
      <div>
        <h2 style={{ fontSize:20, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>Review Your Speech</h2>
        <p style={{ fontSize:13, color:'#6b7a9e', marginTop:4 }}>{duration}s · {wpm} WPM · {fillerCount} fillers · {transcript.trim().split(/\s+/).length} words</p>
      </div>
      <div className="card">
        <textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={10} className="input" style={{ resize:'none', lineHeight:1.65 }} placeholder="Your transcript…" />
        <p style={{ fontSize:11, color:'#4a5568', marginTop:6 }}>You can edit to fix any speech recognition errors</p>
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={reset} className="btn-secondary"><RotateCcw size={13} /> Redo</button>
        <button onClick={analyze} disabled={submitting||!transcript.trim()} className="btn-primary" style={{ flex:1, background:'#7c3aed' }}
          onMouseEnter={e => e.currentTarget.style.background='#8b5cf6'} onMouseLeave={e => e.currentTarget.style.background='#7c3aed'}>
          {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          {submitting ? 'Analyzing…' : 'Analyze with AI'}
        </button>
      </div>
    </div>
  )

  if (phase === 'result' && result) return (
    <div style={{ maxWidth:560, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>
      <motion.div initial={{ scale:0.93, opacity:0 }} animate={{ scale:1, opacity:1 }} className="card" style={{ textAlign:'center', padding:28 }}>
        <div style={{ width:96, height:96, borderRadius:'50%', margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:700, fontFamily:"'Sora',sans-serif", border:`4px solid ${result.overall_score>=7?'#10b981':result.overall_score>=5?'#f59e0b':'#f43f5e'}`, color:result.overall_score>=7?'#34d399':result.overall_score>=5?'#fbbf24':'#fb7185' }}>
          {result.overall_score?.toFixed(1)}
        </div>
        <div style={{ fontSize:18, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>
          {result.overall_score>=7?'🌟 Excellent!':result.overall_score>=5?'👍 Good Job!':'📚 Keep Practicing!'}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:20 }}>
          {[['#38bdf8',result.words_per_minute,'WPM','ideal 120-150'],[result.filler_word_count>5?'#fb7185':'#34d399',result.filler_word_count,'Fillers','aim for 0'],['#a78bfa',result.fluency_score?.toFixed(1),'Fluency','/10']].map(([color,val,label,sub]) => (
            <div key={label} style={{ padding:12, borderRadius:12, background:'#141929', border:'1px solid #1e2640' }}>
              <div style={{ fontSize:20, fontWeight:700, color, fontFamily:"'Sora',sans-serif" }}>{val}</div>
              <div style={{ fontSize:11, color:'#6b7a9e', marginTop:2 }}>{label}</div>
              <div style={{ fontSize:10, color:'#4a5568' }}>{sub}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {result.filler_words_found?.length > 0 && (
        <div className="card" style={{ border:'1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, color:'#fbbf24', marginBottom:10 }}>
            <AlertTriangle size={13} /> Filler Words Detected
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {result.filler_words_found.map(f => <span key={f} className="badge-medium">{f}</span>)}
          </div>
        </div>
      )}

      {result.feedback && (
        <div className="card" style={{ borderLeft:'3px solid #7c3aed' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#a78bfa', marginBottom:8 }}>🤖 AI Analysis</div>
          <p style={{ fontSize:13, lineHeight:1.7, color:'#e8ecf4', whiteSpace:'pre-line' }}>{result.feedback}</p>
        </div>
      )}

      <button onClick={reset} className="btn-secondary"><RotateCcw size={13} /> Try Another Topic</button>
    </div>
  )
}
