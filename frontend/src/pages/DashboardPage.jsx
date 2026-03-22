import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { BookOpen, Code2, Mic, Clock, Trophy, TrendingUp, Target, Zap, ArrowRight, Building2 } from 'lucide-react'
import api from '../utils/api'
import useAuthStore from '../store/authStore'

function ScoreRing({ score = 0, size = 72, color = '#6366f1', label }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const filled = (Math.min(score, 100) / 100) * circ
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <svg width={size} height={size} style={{ flexShrink:0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2640" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          style={{ transform:'rotate(-90deg)', transformOrigin:'center', transition:'stroke-dasharray 1s ease' }} />
        <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="12" fontWeight="700" fontFamily="Sora, sans-serif">{Math.round(score)}%</text>
      </svg>
      {label && (
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'white' }}>{label}</div>
          <div style={{ fontSize:11, color:'#6b7a9e', marginTop:2 }}>Best score</div>
        </div>
      )}
    </div>
  )
}

const CustomTip = ({ active, payload, label }) => active && payload?.length ? (
  <div style={{ padding:'8px 12px', borderRadius:10, background:'#141929', border:'1px solid #1e2640', fontSize:12, color:'#e8ecf4' }}>
    <div style={{ color:'#6b7a9e' }}>{label}</div>
    <div style={{ fontWeight:700, marginTop:2 }}>{payload[0].value?.toFixed(1)}%</div>
  </div>
) : null

const QUICK = [
  { to:'/aptitude',      icon:BookOpen,  label:'Practice Aptitude',  sub:'Quant & Logical',     color:'#818cf8', bg:'rgba(129,140,248,0.08)' },
  { to:'/coding',        icon:Code2,     label:'Solve a Problem',    sub:'Live code execution',  color:'#34d399', bg:'rgba(52,211,153,0.08)'  },
  { to:'/communication', icon:Mic,       label:'Voice Practice',     sub:'AI fluency analysis',  color:'#a78bfa', bg:'rgba(167,139,250,0.08)' },
  { to:'/company',       icon:Building2, label:'Company Mock Test',  sub:'TCS, Infosys & more',  color:'#fbbf24', bg:'rgba(251,191,36,0.08)'  },
]

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:240, gap:12, color:'#6b7a9e' }}>
      <div style={{ width:20, height:20, border:'2px solid #6366f1', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      Loading dashboard…
    </div>
  )

  const sc = stats?.scores || {}
  const sm = stats?.summary || {}
  const la = stats?.last_attempts || {}
  const firstName = stats?.user?.name?.split(' ')[0] || user?.name || 'Student'
  const xp = stats?.user?.total_xp || 0
  const level = Math.floor(xp / 500) + 1

  const radarData = [
    { subject:'Aptitude',      score: sc.aptitude_avg || 0 },
    { subject:'Coding',        score: sc.coding_avg || 0 },
    { subject:'Communication', score: sc.communication_avg || 0 },
  ]

  const statCards = [
    { icon:BookOpen,  label:'Aptitude Tests',  value:sm.aptitude_tests||0,      sub:`Avg ${sc.aptitude_avg?.toFixed(0)||0}%`,      color:'#818cf8', bg:'rgba(129,140,248,0.1)' },
    { icon:Code2,     label:'Coding Tests',    value:sm.coding_tests||0,        sub:`Avg ${sc.coding_avg?.toFixed(0)||0}%`,        color:'#34d399', bg:'rgba(52,211,153,0.1)'  },
    { icon:Mic,       label:'Voice Tests',     value:sm.communication_tests||0, sub:`Avg ${sc.communication_avg?.toFixed(0)||0}%`, color:'#a78bfa', bg:'rgba(167,139,250,0.1)' },
    { icon:Clock,     label:'Time Practiced',  value:`${sm.total_time_minutes?.toFixed(0)||0}m`, sub:'Total minutes', color:'#fbbf24', bg:'rgba(251,191,36,0.1)' },
  ]

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', flexDirection:'column', gap:24 }}>
      {/* Welcome */}
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
        style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div>
          <h2 style={{ fontSize:24, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>
            Welcome back, {firstName}! 👋
          </h2>
          <p style={{ fontSize:13, color:'#6b7a9e', marginTop:4 }}>
            {sm.total_tests === 0 ? "Start your first test to track your progress!" : `${sm.total_tests} tests completed · ${sm.total_time_minutes?.toFixed(0)}m practiced · Level ${level}`}
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:10, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', fontSize:12, fontWeight:600, color:'#818cf8' }}>
          <Zap size={13} /> Level {level} · {xp} XP
        </div>
      </motion.div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }} className="xl:grid-cols-4">
        {statCards.map(({ icon:Icon, label, value, sub, color, bg }, i) => (
          <motion.div key={label} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }} className="card-hover">
            <div style={{ width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:bg, marginBottom:16 }}>
              <Icon size={18} color={color} />
            </div>
            <div style={{ fontSize:24, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>{value}</div>
            <div style={{ fontSize:13, color:'#6b7a9e', marginTop:2 }}>{label}</div>
            {sub && <div style={{ fontSize:11, color:'#4a5568', marginTop:4 }}>{sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* Middle row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }} className="lg:grid-cols-3 grid-cols-1">
        {/* Best scores */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, fontSize:13, fontWeight:700, color:'white' }}>
            <Trophy size={14} color="#fbbf24" /> Personal Best
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[{ label:'Aptitude', score:sc.aptitude_best||0, color:'#818cf8' }, { label:'Coding', score:sc.coding_best||0, color:'#34d399' }, { label:'Communication', score:sc.communication_best||0, color:'#a78bfa' }].map(item => (
              <ScoreRing key={item.label} {...item} />
            ))}
          </div>
        </div>

        {/* Radar */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, fontSize:13, fontWeight:700, color:'white' }}>
            <Target size={14} color="#818cf8" /> Skills Radar
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={radarData} outerRadius={72}>
              <PolarGrid stroke="#1e2640" />
              <PolarAngleAxis dataKey="subject" tick={{ fill:'#6b7a9e', fontSize:11, fontFamily:'DM Sans' }} />
              <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
              <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Last attempts */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, fontSize:13, fontWeight:700, color:'white' }}>
            <Zap size={14} color="#fbbf24" /> Last Attempts
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {la.aptitude && (
              <div style={{ padding:12, borderRadius:12, background:'#141929', border:'1px solid #1e2640' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:'#818cf8', display:'flex', alignItems:'center', gap:4 }}><BookOpen size={9} /> Aptitude</span>
                  <span style={{ fontSize:11, color:'#4a5568' }}>{la.aptitude.date}</span>
                </div>
                <div style={{ fontSize:20, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>{la.aptitude.score?.toFixed(0)}%</div>
              </div>
            )}
            {la.coding && (
              <div style={{ padding:12, borderRadius:12, background:'#141929', border:'1px solid #1e2640' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:'#34d399', display:'flex', alignItems:'center', gap:4 }}><Code2 size={9} /> Coding</span>
                  <span style={{ fontSize:11, color:'#4a5568' }}>{la.coding.date}</span>
                </div>
                <div style={{ fontSize:20, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>{la.coding.score?.toFixed(0)}%</div>
              </div>
            )}
            {la.communication && (
              <div style={{ padding:12, borderRadius:12, background:'#141929', border:'1px solid #1e2640' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:'#a78bfa', display:'flex', alignItems:'center', gap:4 }}><Mic size={9} /> Voice</span>
                  <span style={{ fontSize:11, color:'#4a5568' }}>{la.communication.date}</span>
                </div>
                <div style={{ fontSize:20, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>{la.communication.score?.toFixed(0)}%</div>
                <div style={{ fontSize:11, color:'#4a5568', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{la.communication.topic}</div>
              </div>
            )}
            {!la.aptitude && !la.coding && !la.communication && (
              <div style={{ textAlign:'center', padding:'24px 0', fontSize:13, color:'#4a5568' }}>
                No attempts yet. Start a test!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress chart */}
      {stats?.trends?.aptitude?.length > 1 && (
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, fontSize:13, fontWeight:700, color:'white' }}>
            <TrendingUp size={14} color="#818cf8" /> Aptitude Progress
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={stats.trends.aptitude}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2640" />
              <XAxis dataKey="date" tick={{ fill:'#6b7a9e', fontSize:10 }} />
              <YAxis domain={[0,100]} tick={{ fill:'#6b7a9e', fontSize:10 }} />
              <Tooltip content={<CustomTip />} />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill:'#6366f1', r:3 }} activeDot={{ r:5, fill:'#818cf8' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <div style={{ fontSize:12, fontWeight:600, color:'#4a5568', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Jump Into Practice</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }} className="xl:grid-cols-4">
          {QUICK.map(({ to, icon:Icon, label, sub, color, bg }) => (
            <Link key={to} to={to} style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:12, padding:16, borderRadius:14, background:bg, border:`1px solid ${color}18`, transition:'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor=`${color}40`} onMouseLeave={e => e.currentTarget.style.borderColor=`${color}18`}>
              <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:`${color}20`, flexShrink:0 }}>
                <Icon size={16} color={color} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'white' }}>{label}</div>
                <div style={{ fontSize:11, color:'#6b7a9e' }}>{sub}</div>
              </div>
              <ArrowRight size={13} color="#4a5568" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
