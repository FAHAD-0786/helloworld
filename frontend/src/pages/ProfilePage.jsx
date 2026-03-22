import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { User, Lock, Calendar, Trash2, Plus, Bell, Loader2, Save } from 'lucide-react'
import api from '../utils/api'
import useAuthStore from '../store/authStore'

const COLORS = ['#6366f1','#7c3aed','#059669','#dc2626','#d97706','#0891b2','#be185d','#65a30d']

export default function ProfilePage() {
  const [tab,       setTab]       = useState('profile')
  const [profile,   setProfile]   = useState(null)
  const [dates,     setDates]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [notice,    setNotice]    = useState(null)
  const [newDrive,  setNewDrive]  = useState({ company:'', drive_date:'', notes:'' })
  const [addingD,   setAddingD]   = useState(false)
  const [pw,        setPw]        = useState({ current_password:'', new_password:'', confirm:'' })
  const { user } = useAuthStore()

  useEffect(() => {
    Promise.all([api.get('/profile/me'), api.get('/profile/drive-dates')])
      .then(([p,d]) => { setProfile(p.data); setDates(d.data) })
      .finally(() => setLoading(false))
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    try {
      await api.put('/profile/update', { name:profile.name, college:profile.college, branch:profile.branch, year:profile.year, phone:profile.phone, bio:profile.bio, linkedin:profile.linkedin, github:profile.github, avatar_color:profile.avatar_color })
      toast.success('Profile saved!')
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const changePassword = async () => {
    if (pw.new_password !== pw.confirm) return toast.error('Passwords do not match')
    if (pw.new_password.length < 6) return toast.error('Min 6 characters')
    setSaving(true)
    try {
      await api.put('/profile/change-password', { current_password:pw.current_password, new_password:pw.new_password })
      toast.success('Password changed!'); setPw({ current_password:'', new_password:'', confirm:'' })
    } catch (e) { toast.error(e.response?.data?.detail||'Failed') }
    finally { setSaving(false) }
  }

  const addDrive = async () => {
    if (!newDrive.company||!newDrive.drive_date) return toast.error('Fill company and date')
    setAddingD(true)
    try {
      const r = await api.post('/profile/drive-dates', newDrive)
      setNotice(r.data.message); setTimeout(() => setNotice(null), 8000)
      const d = await api.get('/profile/drive-dates'); setDates(d.data)
      setNewDrive({ company:'', drive_date:'', notes:'' })
    } catch { toast.error('Failed') }
    finally { setAddingD(false) }
  }

  const delDrive = async id => {
    await api.delete(`/profile/drive-dates/${id}`)
    setDates(d => d.filter(x => x.id !== id)); toast.success('Removed')
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'#6b7a9e' }}>Loading…</div>

  const initial = profile?.name?.[0]?.toUpperCase()||'S'
  const level = Math.floor((profile?.total_xp||0)/500)+1

  return (
    <div style={{ maxWidth:700, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>
      {notice && (
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}
          style={{ padding:'12px 16px', borderRadius:12, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', display:'flex', alignItems:'flex-start', gap:10 }}>
          <Bell size={16} color="#34d399" style={{ flexShrink:0, marginTop:1 }} />
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'#34d399' }}>Drive Reminder Set!</div>
            <div style={{ fontSize:13, color:'#6ee7b7', marginTop:2 }}>{notice}</div>
          </div>
        </motion.div>
      )}

      {/* Avatar header */}
      <div className="card" style={{ display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ width:72,height:72,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:700,color:'white',flexShrink:0,background:profile?.avatar_color||'#6366f1' }}>
          {initial}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:18, fontWeight:700, color:'white', fontFamily:"'Sora',sans-serif" }}>{profile?.name}</div>
          <div style={{ fontSize:13, color:'#6b7a9e' }}>{profile?.email}</div>
          <div style={{ fontSize:12, color:'#4a5568', marginTop:2 }}>{profile?.branch&&`${profile.branch} · `}{profile?.college}</div>
          <div style={{ fontSize:12, color:'#818cf8', marginTop:4, fontWeight:600 }}>Level {level} · {profile?.total_xp||0} XP</div>
        </div>
        <div>
          <div style={{ fontSize:11, color:'#6b7a9e', marginBottom:6 }}>Avatar Color</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', maxWidth:128 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setProfile(p => ({...p, avatar_color:c}))}
                style={{ width:22,height:22,borderRadius:'50%',background:c,border:`2px solid ${profile?.avatar_color===c?'white':'transparent'}`,cursor:'pointer',transition:'border 0.15s',transform:profile?.avatar_color===c?'scale(1.15)':'scale(1)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', background:'#0e1320', border:'1px solid #1e2640', borderRadius:12, padding:4, gap:4 }}>
        {[{id:'profile',label:'Profile'},{id:'security',label:'Security'},{id:'drives',label:'Drive Dates'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, padding:'8px 12px', borderRadius:9, fontSize:13, fontWeight:600, border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", background:tab===t.id?'#6366f1':'transparent', color:tab===t.id?'white':'#6b7a9e', transition:'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="card" style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'white' }}>Personal Information</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[['Full Name','name','Arjun Kumar'],['Phone','phone','+91 9xxxxxxxxx'],['College','college','Anna University'],['Branch','branch','CSE']].map(([label,field,ph]) => (
              <div key={field}>
                <label style={{ display:'block', fontSize:11, color:'#6b7a9e', marginBottom:6 }}>{label}</label>
                <input value={profile?.[field]||''} onChange={e => setProfile(p=>({...p,[field]:e.target.value}))} placeholder={ph} className="input" />
              </div>
            ))}
            <div>
              <label style={{ display:'block', fontSize:11, color:'#6b7a9e', marginBottom:6 }}>Year</label>
              <select value={profile?.year||''} onChange={e => setProfile(p=>({...p,year:e.target.value}))} className="input">
                <option value="">Select Year</option>
                {[1,2,3,4].map(y=><option key={y} value={y}>{y}{['st','nd','rd','th'][y-1]} Year</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, color:'#6b7a9e', marginBottom:6 }}>LinkedIn</label>
              <input value={profile?.linkedin||''} onChange={e => setProfile(p=>({...p,linkedin:e.target.value}))} placeholder="linkedin.com/in/yourname" className="input" />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', fontSize:11, color:'#6b7a9e', marginBottom:6 }}>GitHub</label>
              <input value={profile?.github||''} onChange={e => setProfile(p=>({...p,github:e.target.value}))} placeholder="github.com/yourname" className="input" />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ display:'block', fontSize:11, color:'#6b7a9e', marginBottom:6 }}>Bio</label>
              <textarea value={profile?.bio||''} onChange={e => setProfile(p=>({...p,bio:e.target.value}))} rows={3} placeholder="Tell us about yourself…" className="input" style={{ resize:'none' }} />
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving} className="btn-primary" style={{ width:'100%' }}>
            {saving?<Loader2 size={13} className="animate-spin"/>:<Save size={13}/>} Save Profile
          </button>
        </div>
      )}

      {/* Security tab */}
      {tab === 'security' && (
        <div className="card" style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'white' }}>Change Password</div>
          {[['Current Password','current_password'],['New Password','new_password'],['Confirm New Password','confirm']].map(([label,field]) => (
            <div key={field}>
              <label style={{ display:'block', fontSize:11, color:'#6b7a9e', marginBottom:6 }}>{label}</label>
              <input type="password" value={pw[field]} onChange={e => setPw(p=>({...p,[field]:e.target.value}))} placeholder="••••••••" className="input" />
            </div>
          ))}
          <button onClick={changePassword} disabled={saving} className="btn-primary" style={{ width:'100%' }}>
            {saving?<Loader2 size={13} className="animate-spin"/>:<Lock size={13}/>} Change Password
          </button>
        </div>
      )}

      {/* Drive dates tab */}
      {tab === 'drives' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'white', display:'flex', alignItems:'center', gap:8 }}>
              <Calendar size={15} color="#818cf8" /> Add Drive Date
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ display:'block', fontSize:11, color:'#6b7a9e', marginBottom:6 }}>Company</label>
                <input value={newDrive.company} onChange={e => setNewDrive(d=>({...d,company:e.target.value}))} placeholder="TCS, Infosys…" className="input" />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, color:'#6b7a9e', marginBottom:6 }}>Drive Date</label>
                <input type="date" value={newDrive.drive_date} onChange={e => setNewDrive(d=>({...d,drive_date:e.target.value}))} min={new Date().toISOString().split('T')[0]} className="input" />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ display:'block', fontSize:11, color:'#6b7a9e', marginBottom:6 }}>Notes (optional)</label>
                <input value={newDrive.notes} onChange={e => setNewDrive(d=>({...d,notes:e.target.value}))} placeholder="Online test + interview…" className="input" />
              </div>
            </div>
            <button onClick={addDrive} disabled={addingD} className="btn-primary" style={{ width:'100%' }}>
              {addingD?<Loader2 size={13} className="animate-spin"/>:<Plus size={13}/>} Set Drive Reminder
            </button>
          </div>

          {dates.length === 0 && (
            <div className="card" style={{ textAlign:'center', padding:32, color:'#4a5568', fontSize:13 }}>
              No drive dates yet. Add your first one above!
            </div>
          )}
          {dates.map(d => (
            <motion.div key={d.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              className="card" style={{ display:'flex', alignItems:'flex-start', gap:14, border:`1px solid ${d.is_upcoming?'rgba(99,102,241,0.2)':'#1e2640'}` }}>
              <div style={{ width:48,height:48,borderRadius:12,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:11,fontWeight:700,background:d.days_left===0?'rgba(244,63,94,0.15)':d.days_left<=3?'rgba(245,158,11,0.15)':d.days_left<=7?'rgba(251,191,36,0.1)':'rgba(99,102,241,0.1)',color:d.days_left===0?'#fb7185':d.days_left<=3?'#fbbf24':d.days_left<=7?'#fcd34d':'#818cf8' }}>
                <div style={{ fontSize:18, fontWeight:800, fontFamily:"'Sora',sans-serif" }}>{Math.abs(d.days_left)}</div>
                <div style={{ fontSize:9 }}>{d.days_left<0?'ago':d.days_left===0?'TODAY':'days'}</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'white' }}>{d.company}</div>
                <div style={{ fontSize:12, color:'#6b7a9e', marginTop:2 }}>{d.drive_date}</div>
                {d.notes && <div style={{ fontSize:12, color:'#4a5568', marginTop:2 }}>{d.notes}</div>}
                {d.days_left===0 && <div style={{ fontSize:12, color:'#34d399', fontWeight:600, marginTop:4 }}>🎯 All the best today!</div>}
                {d.days_left===1 && <div style={{ fontSize:12, color:'#fbbf24', fontWeight:600, marginTop:4 }}>⏰ Tomorrow! Final prep time!</div>}
              </div>
              <button onClick={() => delDrive(d.id)} style={{ background:'none',border:'none',cursor:'pointer',color:'#4a5568',display:'flex',padding:4,borderRadius:6 }}
                onMouseEnter={e=>e.currentTarget.style.color='#fb7185'} onMouseLeave={e=>e.currentTarget.style.color='#4a5568'}>
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
