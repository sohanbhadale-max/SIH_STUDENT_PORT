import { useState } from 'react'
import { useStore, profileOf } from '../../lib/store'
import { Shell } from '../../components/Shell'
import { Stat, Badge, Icon, Avatar, StatusBadge } from '../../components/ui'
import { fmtDate } from '../../lib/util'
import { PostingsPage } from './Postings'
import { CandidatesPage } from './Candidates'
import { ProfilePage } from '../shared/ProfilePage'

export function IndustryPortal() {
  const { db, session } = useStore()
  const [tab, setTab] = useState('home')
  const profile = profileOf(db, session.userId)

  const myJobs = db.jobs.filter((j) => j.companyId === session.userId)
  const myInterns = db.internships.filter((i) => i.companyId === session.userId)
  const myPostingIds = new Set([...myJobs, ...myInterns].map((p) => p.id))
  const apps = db.applications.filter((a) => myPostingIds.has(a.postingId))
  const fresh = apps.filter((a) => a.status === 'applied')

  const nav = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'jobs', label: 'Jobs', icon: 'briefcase', badge: fresh.filter((a) => a.kind === 'job').length },
    { key: 'internships', label: 'Internships', icon: 'grad', badge: fresh.filter((a) => a.kind === 'internship').length },
    { key: 'candidates', label: 'Candidates', icon: 'users' },
    { key: 'profile', label: 'Company Profile', icon: 'building' },
  ]

  return (
    <Shell title={nav.find((n) => n.key === tab).label} nav={nav} active={tab} onNav={setTab}>
      {tab === 'home' && <Home go={setTab} />}
      {tab === 'jobs' && <PostingsPage kind="job" />}
      {tab === 'internships' && <PostingsPage kind="internship" />}
      {tab === 'candidates' && <CandidatesPage />}
      {tab === 'profile' && <ProfilePage role="industry" />}
    </Shell>
  )
}

function Home({ go }) {
  const { db, session } = useStore()
  const profile = profileOf(db, session.userId)
  const myJobs = db.jobs.filter((j) => j.companyId === session.userId)
  const myInterns = db.internships.filter((i) => i.companyId === session.userId)
  const myPostingIds = new Set([...myJobs, ...myInterns].map((p) => p.id))
  const apps = db.applications.filter((a) => myPostingIds.has(a.postingId))
  const hired = apps.filter((a) => a.status === 'accepted' && a.kind === 'job')
  const recent = [...apps].sort((a, b) => (b.appliedAt || '').localeCompare(a.appliedAt || '')).slice(0, 5)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{db.users[session.userId].name}</h1>
          <p className="sub">
            {profile.address} ·{' '}
            {profile.cinVerified !== false && profile.cin
              ? <Badge tone="green"><Icon name="shield" size={11} /> CIN verified</Badge>
              : <Badge tone="gold">CIN pending</Badge>}
          </p>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 20 }}>
        <div className="card"><Stat label="Open job roles" value={myJobs.length} sub={`${myJobs.reduce((n, j) => n + j.openings, 0)} openings`} /></div>
        <div className="card"><Stat label="Internship slots" value={myInterns.length} sub={`${myInterns.reduce((n, i) => n + i.openings, 0)} openings`} /></div>
        <div className="card"><Stat label="Applications" value={apps.length} sub={`${apps.filter((a) => a.status === 'applied').length} awaiting review`} /></div>
        <div className="card"><Stat label="Offers accepted" value={hired.length} /></div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>Recent applications</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => go('jobs')}>Manage jobs</button>
          </div>
          {recent.length === 0 && <p className="muted">No applications yet — post a job or internship to start hiring.</p>}
          {recent.map((app) => {
            const posting = (app.kind === 'job' ? db.jobs : db.internships).find((p) => p.id === app.postingId)
            return (
              <div key={app.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <Avatar name={db.users[app.applicantId]?.name} />
                <div style={{ flex: 1 }}>
                  <b>{db.users[app.applicantId]?.name}</b>
                  <div className="small muted">{posting?.title} · {fmtDate(app.appliedAt)}</div>
                </div>
                <StatusBadge status={app.status} />
              </div>
            )
          })}
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Hiring focus</h3>
          <p className="small" style={{ lineHeight: 1.7 }}>{profile.description || 'Add a company description to improve candidate matching.'}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {(profile.tags || []).map((t) => <Badge key={t} tone="gold">{t}</Badge>)}
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-accent btn-sm" onClick={() => go('jobs')}><Icon name="plus" size={13} /> Post a job</button>
            <button className="btn btn-ghost btn-sm" onClick={() => go('candidates')}><Icon name="users" size={13} /> Find candidates</button>
          </div>
        </div>
      </div>
    </>
  )
}
