export const uid = () => Math.random().toString(36).slice(2, 10)

export const cx = (...xs) => xs.filter(Boolean).join(' ')

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export const timeAgo = (iso) => {
  if (!iso) return ''
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export const initials = (name = '?') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

export const todayISO = () => new Date().toISOString()

export const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))

export const skillLevel = (score) => (score >= 70 ? 'Advanced' : score >= 40 ? 'Intermediate' : 'Beginner')

export const LEVEL_TONE = { Advanced: 'good', Intermediate: 'warn', Beginner: 'bad' }

export const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`
