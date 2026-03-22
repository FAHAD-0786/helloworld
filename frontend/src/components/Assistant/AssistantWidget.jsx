import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Bot, User, Loader2, Zap } from 'lucide-react'
import api from '../../utils/api'

const QUICK = ['Explain profit & loss', 'TCS NQT topics', 'Binary search in Python', 'How to reduce fillers?', 'HR interview tips']

function Msg({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display:'flex', gap:8, flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{ width:26, height:26, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: isUser ? '#6366f1' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
        {isUser ? <User size={11} color="white" /> : <Bot size={11} color="white" />}
      </div>
      <div style={{
        maxWidth:'85%', padding:'8px 12px', fontSize:12, lineHeight:1.55, whiteSpace:'pre-wrap',
        background: isUser ? '#6366f1' : '#141929',
        color: '#e8ecf4',
        borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
        border: isUser ? 'none' : '1px solid #1e2640',
      }}>
        {msg.content}
      </div>
    </div>
  )
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiOnline, setAiOnline] = useState(null)
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hi! 👋 I'm PlacePro AI, your placement prep assistant!\n\nAsk me about aptitude, coding, communication, or company interview prep."
  }])
  const bottomRef = useRef(null)

  useEffect(() => {
    const check = () => {
      api.get('/assistant/status').then(r => setAiOnline(r.data.online)).catch(() => setAiOnline(false))
    }
    check()
    const t = setInterval(check, 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await api.post('/assistant/chat', { message: msg, session_id: sessionId })
      setSessionId(res.data.session_id)
      setMessages(m => [...m, { role: 'assistant', content: res.data.reply }])
      setAiOnline(true)
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Connection error. Check if backend is running.' }])
    } finally { setLoading(false) }
  }

  const statusColor = aiOnline ? '#10b981' : aiOnline === false ? '#f59e0b' : '#6b7a9e'
  const statusText = aiOnline === null ? 'Checking…' : aiOnline ? 'AI Online' : 'Offline mode'

  return (
    <div style={{ position:'fixed', bottom:20, right:20, zIndex:50, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:12 }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, scale:0.9, y:20 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.9, y:20 }}
            transition={{ type:'spring', stiffness:340, damping:28 }}
            style={{ width:340, height:480, background:'#0e1320', border:'1px solid #1e2640', borderRadius:20, display:'flex', flexDirection:'column', boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}
          >
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderBottom:'1px solid #1e2640', background:'#141929', borderRadius:'20px 20px 0 0', flexShrink:0 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Zap size={14} color="white" />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>PlacePro AI</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:statusColor }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:statusColor }} />
                  {statusText}
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7a9e', display:'flex' }}
                onMouseEnter={e => e.currentTarget.style.color='#e8ecf4'} onMouseLeave={e => e.currentTarget.style.color='#6b7a9e'}>
                <X size={15} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
              {messages.map((m, i) => <Msg key={i} msg={m} />)}
              {loading && (
                <div style={{ display:'flex', gap:8 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Bot size={11} color="white" />
                  </div>
                  <div style={{ padding:'8px 12px', background:'#141929', border:'1px solid #1e2640', borderRadius:'4px 14px 14px 14px' }}>
                    <div className="loading-dots" style={{ display:'flex', gap:4, alignItems:'center' }}>
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {messages.length === 1 && (
              <div style={{ padding:'0 12px 8px', display:'flex', flexWrap:'wrap', gap:6 }}>
                {QUICK.map(s => (
                  <button key={s} onClick={() => send(s)}
                    style={{ fontSize:11, padding:'4px 10px', borderRadius:999, background:'#141929', border:'1px solid #1e2640', color:'#6b7a9e', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.4)'; e.currentTarget.style.color='#e8ecf4' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='#1e2640'; e.currentTarget.style.color='#6b7a9e' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ padding:12, borderTop:'1px solid #1e2640', flexShrink:0 }}>
              <div style={{ display:'flex', gap:8 }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Ask about placements…"
                  style={{ flex:1, background:'#141929', border:'1px solid #1e2640', color:'#e8ecf4', borderRadius:12, padding:'8px 12px', fontSize:12, outline:'none', fontFamily:"'DM Sans',sans-serif" }}
                  onFocus={e => e.currentTarget.style.borderColor='rgba(99,102,241,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor='#1e2640'} />
                <button onClick={() => send()} disabled={!input.trim() || loading}
                  style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, opacity: (!input.trim() || loading) ? 0.4 : 1 }}>
                  {loading ? <Loader2 size={13} color="white" className="animate-spin" /> : <Send size={13} color="white" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button whileHover={{ scale:1.07 }} whileTap={{ scale:0.93 }}
        onClick={() => setOpen(o => !o)}
        style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', boxShadow:'0 8px 32px rgba(99,102,241,0.4)' }}>
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate:-90, opacity:0 }} animate={{ rotate:0, opacity:1 }} exit={{ rotate:90, opacity:0 }}><X size={20} color="white" /></motion.div>
            : <motion.div key="c" initial={{ rotate:90, opacity:0 }} animate={{ rotate:0, opacity:1 }} exit={{ rotate:-90, opacity:0 }}><MessageSquare size={20} color="white" /></motion.div>
          }
        </AnimatePresence>
        <span style={{ position:'absolute', top:-2, right:-2, width:12, height:12, borderRadius:'50%', background:statusColor, border:'2px solid #080b14' }} />
      </motion.button>
    </div>
  )
}
