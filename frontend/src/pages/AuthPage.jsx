import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, Zap, BookOpen, Code2, Mic, TrendingUp } from 'lucide-react'
import useAuthStore from '../store/authStore'

const FEATURES = [
  { icon: BookOpen,   label: 'Aptitude Tests',  desc: '200+ Quant & Logical questions', color: '#818cf8' },
  { icon: Code2,      label: 'Live Coding',      desc: 'Monaco editor + real execution',  color: '#34d399' },
  { icon: Mic,        label: 'Voice Analysis',   desc: 'AI speech fluency feedback',      color: '#a78bfa' },
  { icon: TrendingUp, label: 'Smart Dashboard',  desc: 'XP, levels & progress tracking',  color: '#fbbf24' },
]

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', password:'', college:'', branch:'', year:'' })
  const { login, register, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const onChange = e => { clearError(); setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  const onSubmit = async e => {
    e.preventDefault()
    if (mode === 'login') {
      const r = await login(form.email, form.password)
      if (r.success) { toast.success('Welcome back!'); navigate('/dashboard') }
      else toast.error(r.error)
    } else {
      if (!form.name.trim()) return toast.error('Name required')
      if (form.password.length < 6) return toast.error('Password min 6 chars')
      const r = await register({ name:form.name, email:form.email, password:form.password, college:form.college||null, branch:form.branch||null, year:form.year?parseInt(form.year):null })
      if (r.success) { toast.success('Account created! Sign in.'); setMode('login') }
      else toast.error(r.error)
    }
  }

  return (
    <div className="mesh-bg" style={{ minHeight:'100vh', display:'flex', overflow:'hidden' }}>

      {/* Left panel — hidden on mobile, visible on lg screens */}
      <div className="hidden lg:flex lg:flex-col lg:justify-center"
        style={{ width:'54%', padding:'0 64px', position:'relative', overflow:'hidden' }}>

        <div style={{ position:'absolute', top:0, left:0, width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.12), transparent)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:0, right:0, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.08), transparent)', pointerEvents:'none' }} />

        <motion.div initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.6 }} style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:48 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>PlacementPro</div>
              <div style={{ fontSize:12, color:'#6b7a9e' }}>Training Platform</div>
            </div>
          </div>

          <h1 style={{ fontSize:48, fontWeight:800, lineHeight:1.15, marginBottom:16, fontFamily:"'Sora',sans-serif" }}>
            <span style={{ color:'white' }}>Crack Your</span><br />
            <span className="gradient-text">Campus Placement</span>
          </h1>
          <p style={{ fontSize:17, color:'#6b7a9e', lineHeight:1.7, marginBottom:40 }}>
            100% free platform built for college students.<br />
            Practice, track, and land your dream IT job.
          </p>

          <div style={{ display:'flex', gap:32, marginBottom:40 }}>
            {[['200+','Questions'],['8','Companies'],['100%','Free']].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontSize:22, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>{v}</div>
                <div style={{ fontSize:12, color:'#6b7a9e' }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {FEATURES.map(({ icon:Icon, label, desc, color }, i) => (
              <motion.div key={label} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1+i*0.08 }}
                className="card-sm" style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ width:32, height:32, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:`${color}18`, border:`1px solid ${color}25`, flexShrink:0 }}>
                  <Icon size={15} color={color} />
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'white' }}>{label}</div>
                  <div style={{ fontSize:11, color:'#6b7a9e', marginTop:2 }}>{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — login/register form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:32, overflowY:'auto' }}>
        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} style={{ width:'100%', maxWidth:420 }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ display:'flex', alignItems:'center', gap:8, marginBottom:32 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={16} color="white" />
            </div>
            <span style={{ fontSize:17, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>PlacementPro</span>
          </div>

          <div className="card" style={{ padding:32 }}>
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:20, fontWeight:700, color:'white', marginBottom:4, fontFamily:"'Sora',sans-serif" }}>
                {mode==='login' ? 'Welcome back 👋' : 'Create account'}
              </h2>
              <p style={{ fontSize:13, color:'#6b7a9e' }}>
                {mode==='login' ? 'Sign in to continue your prep journey' : 'Join thousands of students preparing for placements'}
              </p>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', background:'#141929', border:'1px solid #1e2640', borderRadius:12, padding:4, marginBottom:24 }}>
              {['login','register'].map(tab => (
                <button key={tab} onClick={() => { setMode(tab); clearError() }}
                  style={{ flex:1, padding:'8px 16px', borderRadius:9, fontSize:13, fontWeight:600, border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", background:mode===tab?'#6366f1':'transparent', color:mode===tab?'white':'#6b7a9e', transition:'all 0.2s' }}>
                  {tab==='login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form key={mode} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.15 }}
                onSubmit={onSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>

                {mode==='register' && (
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#6b7a9e', marginBottom:6 }}>Full Name *</label>
                    <input name="name" value={form.name} onChange={onChange} required placeholder="Arjun Kumar" className="input" />
                  </div>
                )}

                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#6b7a9e', marginBottom:6 }}>Email *</label>
                  <input name="email" type="email" value={form.email} onChange={onChange} required placeholder="student@college.edu" className="input" />
                </div>

                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#6b7a9e', marginBottom:6 }}>Password *</label>
                  <div style={{ position:'relative' }}>
                    <input name="password" type={showPw?'text':'password'} value={form.password} onChange={onChange} required placeholder="••••••••" className="input" style={{ paddingRight:40 }} />
                    <button type="button" onClick={() => setShowPw(s=>!s)}
                      style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6b7a9e', display:'flex' }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {mode==='register' && (
                  <>
                    <div>
                      <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#6b7a9e', marginBottom:6 }}>College <span style={{ color:'#4a5568' }}>(optional)</span></label>
                      <input name="college" value={form.college} onChange={onChange} placeholder="Anna University" className="input" />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div>
                        <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#6b7a9e', marginBottom:6 }}>Branch</label>
                        <input name="branch" value={form.branch} onChange={onChange} placeholder="CSE" className="input" />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#6b7a9e', marginBottom:6 }}>Year</label>
                        <select name="year" value={form.year} onChange={onChange} className="input">
                          <option value="">Select</option>
                          {[1,2,3,4].map(y=><option key={y} value={y}>{y}{['st','nd','rd','th'][y-1]} Year</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.2)', color:'#fb7185', fontSize:13 }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={isLoading} className="btn-primary" style={{ width:'100%', marginTop:4 }}>
                  {isLoading && <Loader2 size={14} className="animate-spin" />}
                  {mode==='login' ? 'Sign In' : 'Create Account'}
                </button>
              </motion.form>
            </AnimatePresence>
          </div>

          <p style={{ textAlign:'center', fontSize:12, color:'#4a5568', marginTop:16 }}>
            100% Free · No credit card · No ads
          </p>
        </motion.div>
      </div>
    </div>
  )
}
