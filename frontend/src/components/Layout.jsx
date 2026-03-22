import { useState } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, BookOpen, Code2, Mic, Building2, LogOut, Zap, Menu, X, ChevronRight, User } from 'lucide-react'
import useAuthStore from '../store/authStore'
import AssistantWidget from './Assistant/AssistantWidget'

const NAV = [
  { path: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard',     color: '#818cf8' },
  { path: '/aptitude',      icon: BookOpen,        label: 'Aptitude Test', color: '#38bdf8' },
  { path: '/coding',        icon: Code2,           label: 'Coding',        color: '#34d399' },
  { path: '/communication', icon: Mic,             label: 'Communication', color: '#a78bfa' },
  { path: '/company',       icon: Building2,       label: 'Company Prep',  color: '#fbbf24' },
  { path: '/profile',       icon: User,            label: 'Profile',       color: '#fb7185' },
]

export default function Layout() {
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const current = NAV.find(n => pathname.startsWith(n.path))
  const initial = user?.name?.[0]?.toUpperCase() || 'S'
  const xp = user?.total_xp || 0
  const level = Math.floor(xp / 500) + 1
  const progress = (xp % 500) / 500 * 100

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#080b14' }}>
      {/* Sidebar */}
      <aside style={{
        position: open ? 'fixed' : undefined,
        top: 0, left: 0, bottom: 0, zIndex: 50,
        width: 232, display: 'flex', flexDirection: 'column',
        background: '#0e1320', borderRight: '1px solid #1e2640',
        transform: open ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s',
      }} className={`${open ? '' : 'hidden lg:flex'} lg:relative lg:flex lg:transform-none`}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', borderBottom:'1px solid #1e2640' }}>
          <Link to="/dashboard" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={15} color="white" />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'white', fontFamily:'Sora, sans-serif' }}>PlacementPro</div>
              <div style={{ fontSize:11, color:'#6b7a9e' }}>Training Platform</div>
            </div>
          </Link>
          <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7a9e', display:'block' }} className="lg:hidden">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px', overflowY:'auto', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(({ path, icon: Icon, label, color }) => {
            const active = pathname.startsWith(path)
            return (
              <Link key={path} to={path} onClick={() => setOpen(false)}
                className={`nav-link ${active ? 'active' : ''}`}>
                <div style={{ width:26, height:26, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background: active ? `${color}20` : 'transparent' }}>
                  <Icon size={14} color={active ? color : '#6b7a9e'} />
                </div>
                <span style={{ flex:1 }}>{label}</span>
                {active && <ChevronRight size={12} color={color} />}
              </Link>
            )
          })}
        </nav>

        {/* XP bar */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid #1e2640' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:11, color:'#6b7a9e' }}>Level {level}</span>
            <span style={{ fontSize:11, color:'#818cf8', fontWeight:600 }}>{xp} XP</span>
          </div>
          <div className="xp-bar">
            <motion.div className="xp-fill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, delay: 0.5 }} />
          </div>
        </div>

        {/* User */}
        <div style={{ padding:'12px', borderTop:'1px solid #1e2640' }}>
          <Link to="/profile" onClick={() => setOpen(false)} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:12, textDecoration:'none', marginBottom:4 }}
            onMouseEnter={e => e.currentTarget.style.background = '#141929'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width:32, height:32, borderRadius:'50%', background: user?.avatar_color || '#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'white', flexShrink:0 }}>
              {initial}
            </div>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize:11, color:'#6b7a9e', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
            </div>
          </Link>
          <button onClick={handleLogout} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:12, background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#6b7a9e', fontFamily:"'DM Sans',sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.color='#fb7185'; e.currentTarget.style.background='rgba(244,63,94,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color='#6b7a9e'; e.currentTarget.style.background='transparent' }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {open && <div style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(0,0,0,0.6)' }} className="lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
        <header style={{ height:56, display:'flex', alignItems:'center', padding:'0 20px', gap:12, background:'#0e1320', borderBottom:'1px solid #1e2640', flexShrink:0 }}>
          <button onClick={() => setOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7a9e', display:'flex' }} className="lg:hidden">
            <Menu size={20} />
          </button>
          <h1 style={{ fontSize:14, fontWeight:600, color:'white', fontFamily:"'Sora',sans-serif" }}>{current?.label || 'PlacementPro'}</h1>
          <div style={{ flex:1 }} />
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:8, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', fontSize:12, fontWeight:600, color:'#818cf8' }}>
            <Zap size={11} /> {xp} XP
          </div>
        </header>

        <main style={{ flex:1, overflowY:'auto', padding:24 }}>
          <AnimatePresence mode="wait">
            <motion.div key={pathname} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.18 }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AssistantWidget />
    </div>
  )
}
