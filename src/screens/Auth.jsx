import { useState } from 'react'
import { useStore } from '../lib/store'
import { CloudSyncEngine } from '../lib/cloudSync'
import { Icon } from '../components/ui'
import { ProfileWizard } from './ProfileWizard'

const ROLES = [
  { key: 'student', label: 'Student', icon: 'grad', tint: 'var(--marigold-soft)', desc: 'Build your profile, prove your skills, land internships & jobs.' },
  { key: 'faculty', label: 'Faculty', icon: 'book2', tint: 'var(--plum-soft)', desc: 'Post announcements, explore FDPs, guide students to opportunities.' },
  { key: 'institute', label: 'Institute', icon: 'building', tint: 'var(--sky-soft)', desc: 'Track departments, employability scores and placement outcomes.' },
  { key: 'industry', label: 'Industry', icon: 'briefcase', tint: 'var(--jade-soft)', desc: 'Hire verified talent — post jobs & internships, send offers.' },
]

export function AuthFlow() {
  const [role, setRole] = useState(null)
  const [mode, setMode] = useState('global') // global | select | login | signup

  if (mode === 'global') return <GlobalLogin onPickRole={(r) => { setRole(r); setMode('login') }} onRegister={() => setMode('select')} />
  if (mode === 'select') return <RoleSelect onPick={(r) => { setRole(r); setMode('signup') }} onLogin={() => setMode('global')} />
  if (mode === 'login') return <Login role={role} onBack={() => setMode('global')} onSignup={() => setMode('signup')} />
  return <ProfileWizard role={role} onBack={() => setMode('select')} />
}

// Universal Global Login Component — detects role automatically across all cloud users
function GlobalLogin({ onPickRole, onRegister }) {
  const { db, dispatch, login } = useStore()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const rawId = identifier.trim().toLowerCase()
    const cleanId = rawId.replace(/\s+/g, '')
    const digitsId = rawId.replace(/\D/g, '')
    if (!rawId) { setError('Please enter your registered email, contact number, or name.'); return }

    setLoading(true)

    // 1. Fetch latest Cloud State across all connected laptops
    let currentUsers = db.users
    let currentProfiles = db.profiles || {}
    try {
      const cloudData = await CloudSyncEngine.fetchCloudState()
      if (cloudData) {
        dispatch({ type: 'CLOUD_SYNC', payload: cloudData })
        currentUsers = { ...db.users, ...(cloudData.users || {}) }
        currentProfiles = { ...db.profiles, ...(cloudData.profiles || {}) }
      }
    } catch { /* ignore */ }

    // 2. Find user across ALL roles globally
    const userList = Object.values(currentUsers)
    const user = userList.find((u) => {
      const uEmail = (u.email || '').toLowerCase()
      const uPhone = (u.phone || '').replace(/\D/g, '')
      const uId = (u.id || '').toLowerCase()
      const uName = (u.name || '').toLowerCase()
      return (
        uEmail === cleanId ||
        (uEmail.includes('@') && uEmail.split('@')[0] === cleanId) ||
        (digitsId && uPhone && uPhone.endsWith(digitsId)) ||
        uId === cleanId ||
        uName === rawId
      )
    })

    if (!user) {
      setLoading(false)
      setError('No registered account found. Click "Create a profile" below to register.')
      return
    }

    // 3. Verify password if set
    if (user.password && password && user.password !== password) {
      setLoading(false)
      setError('Incorrect password. Please try again.')
      return
    }

    // 4. Log in into the automatically detected role portal
    login(user.id, user, currentProfiles[user.id])
    setLoading(false)
  }

  const allAccounts = Object.values(db.users)

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="brand" style={{ padding: 0, marginBottom: 16 }}>
          <img src="/logo.png" alt="SkillBridge Logo" style={{ height: 48, background: '#ffffff', padding: '6px 12px', borderRadius: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }} />
        </div>
        <div>
          <h1>Global Single Sign-On Portal</h1>
          <p style={{ maxWidth: 440, color: '#b9c6cd', marginTop: 14, lineHeight: 1.7 }}>
            One single login for <b>Students</b>, <b>Faculty</b>, <b>Institutes</b>, and <b>Industry Recruiters</b>.
            Your role is detected automatically with real-time cloud synchronization.
          </p>
        </div>
        <div className="hero-foot">☁️ Realtime Cloud Database & Email Password Authentication</div>
      </div>

      <div className="auth-panel" style={{ overflowY: 'auto' }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>Sign in to SkillBridge</h1>
        <p className="muted" style={{ marginBottom: 20 }}>Enter your registered email address and password.</p>

        <form onSubmit={submit}>
          <div className="field">
            <label>Email Address or Contact Number</label>
            <input
              className="input" autoFocus placeholder="you@example.com or +91 98765 43210"
              value={identifier} onChange={(e) => { setIdentifier(e.target.value); setError('') }}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password" className="input" placeholder="Enter your account password"
              value={password} onChange={(e) => { setPassword(e.target.value); setError('') }}
            />
          </div>
          {error && <p className="small" style={{ color: 'var(--bad)', margin: '6px 0 12px' }}>{error}</p>}

          <button className="btn btn-accent btn-lg" style={{ width: '100%', marginTop: 6 }} type="submit" disabled={loading}>
            {loading ? 'Authenticating & Syncing Cloud…' : 'Sign in to Portal'} <Icon name="arrow" size={16} />
          </button>
        </form>

        <div className="divider" style={{ margin: '20px 0' }} />

        <div style={{ marginBottom: 12 }}>
          <span className="small muted" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>⚡ Quick Demo Login Buttons:</span>
        </div>

        {/* Highlighted Demo Student Logins */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {db.users['u-priya'] && (
            <button
              className="btn btn-outline" style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '8px 10px', background: 'var(--marigold-soft)', borderColor: 'var(--marigold)' }}
              onClick={() => login('u-priya', db.users['u-priya'], db.profiles['u-priya'])}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>🎓 Priya Sharma</div>
                <div className="small muted">Student (Assessed)</div>
              </div>
            </button>
          )}
          {db.users['u-vikram'] && (
            <button
              className="btn btn-outline" style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '8px 10px', background: 'var(--plum-soft)', borderColor: 'var(--plum)' }}
              onClick={() => login('u-vikram', db.users['u-vikram'], db.profiles['u-vikram'])}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>🎓 Vikram Singh</div>
                <div className="small muted">Student (Unassessed)</div>
              </div>
            </button>
          )}
        </div>

        {/* Other Key Role Demo Logins */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
          {allAccounts.map((u) => (
            <button key={u.id} className="btn btn-ghost" style={{ justifyContent: 'space-between', padding: '6px 10px' }} onClick={() => login(u.id, u, db.profiles[u.id])}>
              <span style={{ fontSize: 13 }}><b>{u.name}</b> <span className="muted">({u.role})</span></span>
              <span className="small muted">{u.email}</span>
            </button>
          ))}
        </div>

        <div className="divider" style={{ margin: '20px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <p className="muted small" style={{ marginBottom: 10 }}>New to SkillBridge?</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={onRegister}>
            <Icon name="plus" size={15} /> Create a new Profile / Register
          </button>
        </div>
      </div>
    </div>
  )
}

function RoleSelect({ onPick, onLogin }) {
  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="brand" style={{ padding: 0, marginBottom: 16 }}>
          <img src="/logo.png" alt="SkillBridge Logo" style={{ height: 48, background: '#ffffff', padding: '6px 12px', borderRadius: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }} />
        </div>
        <div>
          <h1>Create your <em>SkillBridge</em> account.</h1>
          <p style={{ maxWidth: 440, color: '#b9c6cd', marginTop: 14, lineHeight: 1.7 }}>
            Select your account type to set up your profile and password.
          </p>
        </div>
        <div className="hero-foot">Realtime Cloud Storage & Password Registration</div>
      </div>
      <div className="auth-panel">
        <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginBottom: 14 }} onClick={onLogin}>
          ← Back to Global Sign In
        </button>
        <p className="small muted" style={{ textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700 }}>Registration</p>
        <h1 style={{ fontSize: 26, margin: '6px 0 4px' }}>Choose your Portal Role</h1>
        <p className="muted" style={{ marginBottom: 20 }}>Select your role to set up your profile and login password.</p>
        <div className="role-grid">
          {ROLES.map((r) => (
            <button key={r.key} className="role-card" onClick={() => onPick(r.key)}>
              <div className="role-ico" style={{ background: r.tint }}><Icon name={r.icon} size={21} /></div>
              <h3>{r.label}</h3>
              <p>{r.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Login({ role, onBack, onSignup }) {
  const { db, dispatch, login } = useStore()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const roleMeta = ROLES.find((r) => r.key === role)
  const demoUsers = Object.values(db.users).filter((u) => u.role === role).slice(0, 4)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const id = identifier.trim().toLowerCase().replace(/\s+/g, '')
    if (!id) { setError('Please enter your email or phone number.'); return }

    setLoading(true)

    // 1. Fetch latest Cloud state to retrieve all accounts created on any laptop
    let currentUsers = db.users
    try {
      const cloudData = await CloudSyncEngine.fetchCloudState()
      if (cloudData) {
        dispatch({ type: 'CLOUD_SYNC', payload: cloudData })
        currentUsers = { ...db.users, ...(cloudData.users || {}) }
      }
    } catch { /* cloud fetch backup */ }

    // 2. Look up user in Cloud & Local Store
    let user = Object.values(currentUsers).find(
      (u) => u.role === role && (u.email?.toLowerCase() === id || u.phone?.replace(/\s+/g, '').toLowerCase() === id || u.id?.toLowerCase() === id),
    )

    if (!user) {
      user = Object.values(currentUsers).find(
        (u) => u.email?.toLowerCase() === id || u.phone?.replace(/\s+/g, '').toLowerCase() === id,
      )
    }

    if (!user) {
      setLoading(false)
      setError('No registered account found for that email/phone. Click "Create profile" below to sign up.')
      return
    }

    // Verify password if set
    if (user.password && password && user.password !== password) {
      setLoading(false)
      setError('Incorrect password. Please try again.')
      return
    }

    // 3. Authenticate user
    login(user.id)
    setLoading(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="brand" style={{ padding: 0, marginBottom: 16 }}>
          <img src="/logo.png" alt="SkillBridge Logo" style={{ height: 48, background: '#ffffff', padding: '6px 12px', borderRadius: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }} />
        </div>
        <div>
          <h1>Welcome back to the <em>{roleMeta.label}</em> portal.</h1>
          <p style={{ maxWidth: 440, color: '#b9c6cd', marginTop: 14, lineHeight: 1.6 }}>
            🔒 Authenticated via Realtime Cloud Database & Email Password Authentication.
          </p>
        </div>
        <div className="hero-foot">Login with your registered email or phone number</div>
      </div>
      <div className="auth-panel">
        <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginBottom: 18 }} onClick={onBack}>
          ← Back to Global Sign In
        </button>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>Sign in as {roleMeta.label}</h1>
        <p className="muted" style={{ marginBottom: 20 }}>Enter your email address and password to sign in.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Registered Email or Phone</label>
            <input
              className="input" autoFocus placeholder={role === 'student' ? 'priya@sunfield.edu.in' : role === 'institute' ? 'registrar@sunfield.edu.in' : 'you@example.com'}
              value={identifier} onChange={(e) => { setIdentifier(e.target.value); setError('') }}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password" className="input" placeholder="••••••••"
              value={password} onChange={(e) => { setPassword(e.target.value); setError('') }}
            />
          </div>
          {error && <p className="small" style={{ color: 'var(--bad)', margin: '6px 0 10px' }}>{error}</p>}
          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} type="submit" disabled={loading}>
            {loading ? 'Authenticating…' : 'Sign in'} <Icon name="arrow" size={16} />
          </button>
        </form>
        <div className="divider" />
        <p className="small muted">Accounts registered under this role — click to sign in instantly:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {demoUsers.map((u) => (
            <button key={u.id} className="btn btn-ghost" style={{ justifyContent: 'space-between' }} onClick={() => login(u.id)}>
              <span>{u.name}</span>
              <span className="small muted">{u.email}</span>
            </button>
          ))}
        </div>
        <p className="small" style={{ marginTop: 18 }}>
          New here?{' '}
          <button type="button" className="btn btn-accent btn-sm" onClick={onSignup}>Create {roleMeta.label} profile</button>
        </p>
      </div>
    </div>
  )
}
