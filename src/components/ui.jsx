import { createContext, useContext, useEffect, useState } from 'react'
import { cx, initials } from '../lib/util'

// ---------- icons (inline, stroke style) ----------
const PATHS = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></>,
  grad: <><path d="M12 3 2 8l10 5 10-5-10-5Z" /><path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" /></>,
  building: <><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" /><path d="M10 21v-3h4v3" /></>,
  book: <><path d="M4 19V5a2 2 0 0 1 2-2h13v14H6.5A2.5 2.5 0 0 0 4 19Zm0 0A2.5 2.5 0 0 0 6.5 21.5H19" /></>,
  cert: <><circle cx="12" cy="9" r="5" /><path d="m9 13-1.5 8L12 18.5 16.5 21 15 13" /></>,
  doc: <><path d="M6 2h8l4 4v16H6V2Z" /><path d="M14 2v4h4" /><path d="M9 12h6M9 16h6" /></>,
  bell: <><path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9" /><path d="M10 19.5a2.2 2.2 0 0 0 4 0" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" /></>,
  users: <><circle cx="9" cy="8.5" r="3.5" /><path d="M2.5 20c1.2-3 3.6-4.5 6.5-4.5s5.3 1.5 6.5 4.5" /><path d="M15.5 5.6a3.5 3.5 0 0 1 0 5.8M18 15.7c1.8.8 3 2.2 3.5 4.3" /></>,
  chart: <><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" rx=".7" /><rect x="12" y="8" width="3" height="10" rx=".7" /><rect x="17" y="5" width="3" height="13" rx=".7" /></>,
  spark: <><path d="M12 2c.6 4.8 2.4 7.4 8 8-5.6.6-7.4 3.2-8 8-.6-4.8-2.4-7.4-8-8 5.6-.6 7.4-3.2 8-8Z" /></>,
  send: <><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4L22 2Z" /></>,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  pin: <><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  logout: <><path d="M9 4H5v16h4" /><path d="M14 8l4 4-4 4M18 12H9" /></>,
  edit: <><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17l-1 4Z" /><path d="m13.5 6.5 3 3" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  phone: <path d="M5 3h4l1.5 5L8 10a12 12 0 0 0 6 6l2-2.5 5 1.5v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" />,
  shield: <><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" /><path d="m8.5 11.5 2.5 2.5 4.5-5" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
  book2: <><path d="M2 6s2.5-1.5 6-1.5S14 6 14 6v13s-2.5-1.5-6-1.5S2 19 2 19V6Z" /><path d="M22 6s-2.5-1.5-6-1.5S10 6 10 6" /><path d="M22 6v13s-2.5-1.5-6-1.5" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6" /><path d="M14 11v6" /></>,
}

export function Icon({ name, size = 18, className }) {
  return (
    <svg
      className={className} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[name] || PATHS.spark}
    </svg>
  )
}

// ---------- primitives ----------
export const Badge = ({ tone = 'gray', children, className }) => (
  <span className={cx('badge', tone, className)}>{children}</span>
)

export function Avatar({ name, src, size }) {
  return (
    <div className={cx('avatar', size === 'lg' && 'lg')}>
      {src ? <img src={src} alt={name} /> : initials(name)}
    </div>
  )
}

export function ScoreRing({ value, size = 64, stroke = 7, label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const tone = value >= 70 ? 'var(--jade)' : value >= 45 ? 'var(--marigold)' : 'var(--rust)'
  return (
    <div className="ring" style={{ width: size, height: size }} title={label ?? `Score ${value}/100`}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--paper-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="round"
        />
      </svg>
      <span className="ring-val" style={{ fontSize: size / 4.2 }}>{value}</span>
    </div>
  )
}

export function Field({ label, hint, children, className }) {
  return (
    <div className={cx('field', className)}>
      {label && <label>{label}</label>}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export const TextInput = (props) => <input className="input" {...props} />
export const Select = ({ children, ...props }) => <select className="select" {...props}>{children}</select>
export const TextArea = (props) => <textarea className="textarea" {...props} />

export function Modal({ title, children, onClose, wide }) {
  useEffect(() => {
    const fn = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={cx('modal', wide && 'wide')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><Icon name="x" size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Empty({ icon = 'spark', title, sub, action }) {
  return (
    <div className="empty">
      <div className="empty-ico"><Icon name={icon} size={34} /></div>
      <h3>{title}</h3>
      {sub && <p className="small" style={{ marginTop: 6 }}>{sub}</p>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.key} className={cx('tab', value === t.key && 'active')} onClick={() => onChange(t.key)}>
          {t.label}{t.count != null && <span className="muted"> ({t.count})</span>}
        </button>
      ))}
    </div>
  )
}

export function ProgressBar({ value }) {
  return <div className="progress"><div style={{ width: `${Math.min(100, value)}%` }} /></div>
}

export function SkillChips({ skills, selected, onToggle, all }) {
  const pool = all ?? skills
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {pool.map((s) => {
        const on = selected?.includes(s)
        return (
          <button key={s} type="button" className={cx('skill-chip', on && 'on')} onClick={() => onToggle?.(s)}>
            {on && <Icon name="check" size={12} />}{s}
          </button>
        )
      })}
    </div>
  )
}

// ---------- toast ----------
const ToastCtx = createContext(null)
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = (text) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

// ---------- stats ----------
export function Stat({ label, value, sub }) {
  return (
    <div className="stat">
      <span className="stat-val mono">{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span className="small muted">{sub}</span>}
    </div>
  )
}

export const STATUS_META = {
  applied: { label: 'Applied', tone: 'sky' },
  shortlisted: { label: 'Shortlisted', tone: 'gold' },
  interview: { label: 'Interview scheduled', tone: 'plum' },
  interview_cleared: { label: 'Interview Cleared', tone: 'green' },
  offer: { label: 'Offer received', tone: 'green' },
  accepted: { label: 'Accepted', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'rust' },
  declined: { label: 'Declined', tone: 'rust' },
  completed: { label: 'Completed', tone: 'green' },
  selected: { label: 'Selected', tone: 'green' },
}

export const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || { label: status, tone: 'gray' }
  return <Badge tone={m.tone}>{m.label}</Badge>
}
