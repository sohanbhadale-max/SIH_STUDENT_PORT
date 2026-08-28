import { useState } from 'react'
import { useStore, appsFor, eligibleInternships, employability, verifiedSkills, profileOf, notificationsFor } from '../../lib/store'
import { Shell } from '../../components/Shell'
import { ScoreRing, Icon, Badge, useToast, Empty } from '../../components/ui'
import { timeAgo } from '../../lib/util'
import { Assessment } from './Assessment'
import { Learn } from './Learn'
import { ResumePage } from './Resume'
import { InternshipsPage } from './Internships'
import { JobsPage } from './Jobs'
import { AnnouncementsView } from '../../components/Announcements'
import { ProfilePage } from '../shared/ProfilePage'

export function StudentPortal() {
  const { db, session } = useStore()
  const id = session.userId
  const profile = profileOf(db, id)
  const [tab, setTab] = useState('home')
  const apps = appsFor(db, id)
  const hasAssessment = Boolean(db.assessments[id])
  const matches = eligibleInternships(db, id)

  const nav = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'assessment', label: 'Skill Assessment', icon: 'target', badge: hasAssessment ? 0 : 1 },
    { key: 'internships', label: 'Internships', icon: 'briefcase', badge: matches.length },
    { key: 'jobs', label: 'Jobs', icon: 'search' },
    { key: 'learn', label: 'Courses', icon: 'book' },
    { key: 'resume', label: 'Resume', icon: 'doc' },
    { key: 'announcements', label: 'Announcements', icon: 'bell' },
    { key: 'profile', label: 'My Profile', icon: 'user' },
  ]

  return (
    <Shell title={nav.find((n) => n.key === tab).label} nav={nav} active={tab} onNav={setTab}>
      {tab === 'home' && <Home go={setTab} />}
      {tab === 'assessment' && <Assessment />}
      {tab === 'internships' && <InternshipsPage />}
      {tab === 'jobs' && <JobsPage />}
      {tab === 'learn' && <Learn />}
      {tab === 'resume' && <ResumePage />}
      {tab === 'announcements' && <AnnouncementsView />}
      {tab === 'profile' && <ProfilePage role="student" />}
    </Shell>
  )
}

function Home({ go }) {
  const { db, session } = useStore()
  const toast = useToast()
  const id = session.userId
  const profile = profileOf(db, id)
  const a = db.assessments[id]
  const apps = appsFor(db, id)
  const emp = employability(db, id)
  const matches = eligibleInternships(db, id)
  const certs = db.enrollments.filter((e) => e.userId === id && e.status === 'completed')
  const skills = verifiedSkills(db, id)
  const notifs = notificationsFor(db, id).slice(0, 4)
  const offersPending = apps.filter((x) => x.status === 'offer' && (!x.offer?.response || x.offer?.response === 'pending'))
  const scheduledInterviews = apps.filter((x) => x.interview)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hi {db.users[id]?.name?.split(' ')[0]} 👋</h1>
          <p className="sub">{profile.degree || profile.eduLevel}{profile.institute ? ` · ${profile.institute}` : ''}</p>
        </div>
      </div>

      {!a && (
        <div className="notice" style={{ marginBottom: 18 }}>
          <Icon name="target" size={18} />
          <div>
            <b>Complete your skill assessment.</b> Your claimed skills stay hidden until verified, and verified
            skills unlock internship matches and your employability score.
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-accent btn-sm" onClick={() => go('assessment')}>Take assessment</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid cols-4" style={{ marginBottom: 18 }}>
        <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <ScoreRing value={emp} size={72} label="Employability score" />
          <div>
            <h3 style={{ fontSize: 15 }}>Employability</h3>
            <p className="small muted" style={{ margin: 0 }}>match-based score</p>
          </div>
        </div>
        <div className="card"><div className="stat"><span className="stat-val mono">{apps.length}</span><span className="stat-label">Applications</span></div></div>
        <div className="card"><div className="stat"><span className="stat-val mono">{certs.length}</span><span className="stat-label">Certificates</span></div></div>
        <div className="card"><div className="stat"><span className="stat-val mono">{skills ? skills.length : '—'}</span><span className="stat-label">{skills ? 'Verified skills' : 'Skills locked'}</span></div></div>
      </div>

      {scheduledInterviews.length > 0 && (
        <div className="card" style={{ marginBottom: 18, borderLeft: '4px solid var(--accent)', background: 'var(--marigold-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Icon name="calendar" size={20} style={{ color: 'var(--accent)' }} />
            <h3 style={{ margin: 0 }}>Upcoming Scheduled Interviews</h3>
          </div>
          {scheduledInterviews.map((app) => {
            const posting = db.jobs.find((j) => j.id === app.postingId) || db.internships.find((i) => i.id === app.postingId)
            const companyName = posting?.company || db.users[posting?.companyId]?.name || 'Company'
            return (
              <div key={app.id} style={{ padding: '12px 14px', background: '#fff', borderRadius: 8, marginTop: 8, border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <b style={{ fontSize: 15 }}>{posting?.title} — {companyName}</b>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      📅 <b>Date:</b> {app.interview.date} at {app.interview.time} &nbsp;|&nbsp; 📍 <b>Mode:</b> {app.interview.mode}
                    </div>
                    {app.interview.notes && <div className="small muted" style={{ marginTop: 4 }}><b>Notes:</b> {app.interview.notes}</div>}
                  </div>
                  {app.interview.link && (
                    <a href={app.interview.link} target="_blank" rel="noreferrer" className="btn btn-accent btn-sm">
                      Join / View Link <Icon name="arrow" size={13} />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {offersPending.length > 0 && (
        <div className="notice success" style={{ marginBottom: 18 }}>
          <Icon name="cert" size={18} />
          <div>
            <b>You have {offersPending.length} job offer{offersPending.length > 1 ? 's' : ''} waiting.</b> Review and respond in the Jobs section.
            <div style={{ marginTop: 8 }}><button className="btn btn-good btn-sm" onClick={() => go('jobs')}>View offers</button></div>
          </div>
        </div>
      )}

      <div className="grid cols-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>Internship matches for you</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => go('internships')}>See all</button>
          </div>
          {matches.length === 0
            ? <Empty icon="briefcase" title={skills ? 'No eligible matches right now' : 'Assessment needed'} sub={skills ? 'Check back as new internships are posted.' : 'Take your skill assessment to unlock verified internship matches.'} />
            : matches.slice(0, 3).map(({ posting, score }) => (
              <div key={posting.id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                <ScoreRing value={score} size={52} stroke={6} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{posting.title}</b>
                  <p className="small muted" style={{ margin: 0 }}>{posting.location} · {posting.duration} · {posting.stipend}</p>
                </div>
                <Badge tone="green">Eligible</Badge>
              </div>
            ))}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>Recent notifications</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => go('announcements')}>Announcements</button>
          </div>
          {notifs.length === 0 && <p className="muted">Nothing yet — apply to internships and jobs to see updates here.</p>}
          {notifs.map((n) => (
            <div key={n.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)', fontSize: 13.5 }}>
              {n.text}
              <div className="small muted">{timeAgo(n.createdAt)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
