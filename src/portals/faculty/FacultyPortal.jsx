import { useState } from 'react'
import { useStore, profileOf, appsFor } from '../../lib/store'
import { Shell } from '../../components/Shell'
import { Badge, Icon, useToast, Empty, StatusBadge, Avatar, ScoreRing, Field, TextInput, Select, TextArea } from '../../components/ui'
import { uid, todayISO, fmtDate } from '../../lib/util'
import { AnnouncementsView } from '../../components/Announcements'
import { StudentProfileModal } from '../industry/Candidates'
import { ProfilePage } from '../shared/ProfilePage'

export function FacultyPortal() {
  const { db, session } = useStore()
  const [tab, setTab] = useState('home')
  const apps = appsFor(db, session.userId)
  const shortlisted = apps.filter((a) => ['shortlisted', 'interview', 'selected'].includes(a.status))

  const nav = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'fdp', label: 'Explore FDPs', icon: 'book' },
    { key: 'internships', label: 'Internships', icon: 'briefcase', badge: shortlisted.length },
    { key: 'announcements', label: 'Announcements', icon: 'bell' },
    { key: 'students', label: 'Students', icon: 'users' },
    { key: 'profile', label: 'My Profile', icon: 'user' },
  ]

  return (
    <Shell title={nav.find((n) => n.key === tab).label} nav={nav} active={tab} onNav={setTab}>
      {tab === 'home' && <Home go={setTab} />}
      {tab === 'fdp' && <Fdps />}
      {tab === 'internships' && <FacultyInternships />}
      {tab === 'announcements' && <FacultyAnnouncements />}
      {tab === 'students' && <FacultyStudents />}
      {tab === 'profile' && <ProfilePage role="faculty" />}
    </Shell>
  )
}

function Home({ go }) {
  const { db, session } = useStore()
  const profile = profileOf(db, session.userId)
  const myAnnouncements = db.announcements.filter((a) => a.facultyId === session.userId)
  const apps = appsFor(db, session.userId)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{db.users[session.userId].name}</h1>
          <p className="sub">{profile.department}{profile.experience ? ` · ${profile.experience}` : ''}</p>
        </div>
      </div>
      <div className="grid cols-3" style={{ marginBottom: 22 }}>
        <div className="card">
          <div className="stat"><span className="stat-val mono">{myAnnouncements.length}</span><span className="stat-label">Announcements posted</span></div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => go('announcements')}>Post a new one</button>
        </div>
        <div className="card">
          <div className="stat"><span className="stat-val mono">{db.fdps.length}</span><span className="stat-label">FDPs open for enrolment</span></div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => go('fdp')}>Explore programs</button>
        </div>
        <div className="card">
          <div className="stat"><span className="stat-val mono">{apps.length}</span><span className="stat-label">Internship applications</span></div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => go('internships')}>View status</button>
        </div>
      </div>

      {(profile.papers || []).length > 0 && (
        <div className="card" style={{ marginBottom: 22 }}>
          <h3 style={{ marginBottom: 10 }}>Research papers</h3>
          {profile.papers.map((p, i) => (
            <p key={i} className="small" style={{ marginBottom: 6 }}>📄 <b>{p.title}</b>{p.detail ? ` — ${p.detail}` : ''}</p>
          ))}
        </div>
      )}

      <h3 style={{ marginBottom: 12 }}>Latest announcements (visible to students)</h3>
      <AnnouncementsView />
    </>
  )
}

function Fdps() {
  const { db, session, saveProfile } = useStore()
  const toast = useToast()
  const profile = profileOf(db, session.userId)
  const [registered, setRegistered] = useState(profile.fdpRegistered || [])

  const register = (fdp) => {
    const next = [...registered, fdp.id]
    setRegistered(next)
    saveProfile(session.userId, { fdpRegistered: next })
    toast(`Registered for “${fdp.title}” — confirmation sent to your email.`)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Faculty Development Programs</h1>
          <p className="sub">Training programs listed by government and national portals.</p>
        </div>
      </div>
      <div className="grid cols-2">
        {db.fdps.map((f) => (
          <div key={f.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <Badge tone="plum"><Icon name="shield" size={11} /> {f.org}</Badge>
              <Badge tone="gray">{f.mode}</Badge>
            </div>
            <h3 style={{ margin: '10px 0 6px' }}>{f.title}</h3>
            <p className="small muted">Starts {f.starts} · {f.duration} · {f.seats} seats</p>
            <div style={{ display: 'flex', gap: 6, margin: '8px 0 12px' }}>
              {(f.tags || []).map((t) => <Badge key={t} tone="outline">{t}</Badge>)}
            </div>
            {registered.includes(f.id)
              ? <Badge tone="green"><Icon name="check" size={12} /> Registered</Badge>
              : <button className="btn btn-accent btn-sm" onClick={() => register(f)}>Register</button>}
          </div>
        ))}
      </div>
    </>
  )
}

function FacultyInternships() {
  const { db, session, apply, notify } = useStore()
  const toast = useToast()
  const apps = appsFor(db, session.userId).filter((a) => a.kind === 'internship')
  const appliedIds = new Set(apps.map((a) => a.postingId))

  const onApply = (posting) => {
    const app = {
      id: uid(), kind: 'internship', postingId: posting.id, applicantId: session.userId,
      status: 'applied', appliedAt: todayISO(),
      resumeSnapshot: { name: db.users[session.userId].name, ...profileOf(db, session.userId) },
    }
    apply(app)
    notify(posting.companyId, `${db.users[session.userId].name} (faculty) applied for ${posting.title}.`, { icon: 'doc' })
    toast('Application sent to the company.')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Industry internships for faculty</h1>
          <p className="sub">All openings are listed below — apply and you’ll be notified if shortlisted.</p>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginBottom: 24 }}>
        {db.internships.map((posting) => {
          const company = db.users[posting.companyId]
          const mine = apps.find((a) => a.postingId === posting.id)
          return (
            <div key={posting.id} className="card">
              <h3 style={{ fontSize: 15.5 }}>{posting.title}</h3>
              <p className="small muted">{company?.name} · {posting.location} · {posting.duration} · {posting.stipend}</p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', margin: '8px 0' }}>
                {posting.skills.map((s) => <Badge key={s} tone="outline">{s}</Badge>)}
              </div>
              {mine
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusBadge status={mine.status} />
                    {mine.status === 'interview' && mine.interview && <span className="small muted">on {fmtDate(mine.interview.date)} · {mine.interview.time}</span>}
                  </div>
                : <button className="btn btn-accent btn-sm" onClick={() => onApply(posting)}><Icon name="send" size={13} /> Apply</button>}
            </div>
          )
        })}
      </div>

      <h3 style={{ marginBottom: 10 }}>My applications</h3>
      {apps.length === 0 && <Empty icon="briefcase" title="No applications yet" sub="Apply to an internship above." />}
      {apps.map((app) => {
        const posting = db.internships.find((i) => i.id === app.postingId)
        return (
          <div key={app.id} className="card" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <b>{posting?.title}</b>
              <div className="small muted">{posting && db.users[posting.companyId]?.name} · applied {fmtDate(app.appliedAt)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {app.status === 'interview' && app.interview && (
                <Badge tone="plum"><Icon name="calendar" size={11} /> {fmtDate(app.interview.date)} · {app.interview.time} · {app.interview.mode}</Badge>
              )}
              <StatusBadge status={app.status} />
            </div>
          </div>
        )
      })}
    </>
  )
}

function FacultyAnnouncements() {
  const { db, session, announce, notify } = useStore()
  const toast = useToast()
  const [form, setForm] = useState({ title: '', audience: 'All students', body: '' })
  const fProfile = profileOf(db, session.userId)
  const instName = fProfile.institute || 'Sunfield Institute of Technology'

  const post = () => {
    const a = { id: uid(), facultyId: session.userId, institute: instName, ...form, createdAt: todayISO() }
    announce(a)
    for (const u of Object.values(db.users)) {
      if (u.role === 'student' && profileOf(db, u.id).institute === instName) {
        notify(u.id, `New announcement from ${db.users[session.userId].name}: “${form.title}”.`, { icon: 'bell', meta: { announcementId: a.id } })
      }
    }
    setForm({ title: '', audience: 'All students', body: '' })
    toast('Announcement posted — students of your institute have been notified.')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Announcements ({instName})</h1>
          <p className="sub">Post notices — students of your institute see them in their Announcements section.</p>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 24, maxWidth: 720 }}>
        <Field label="Title"><TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Campus drive: FinEdge Analytics — 20 Sep" /></Field>
        <Field label="Audience">
          <Select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
            <option>All students</option>
            <option>Final year students</option>
            <option>Computer Science</option>
            <option>Electronics & Communication</option>
            <option>Mechanical</option>
            <option>Data Science</option>
          </Select>
        </Field>
        <Field label="Message"><TextArea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write the full announcement…" style={{ minHeight: 120 }} /></Field>
        <button className="btn btn-accent" disabled={!form.title.trim() || !form.body.trim()} onClick={post}>
          <Icon name="send" size={14} /> Post announcement
        </button>
      </div>
      <AnnouncementsView filterInstitute={instName} />
    </>
  )
}

function FacultyStudents() {
  const { db, session } = useStore()
  const [open, setOpen] = useState(null)
  const fProfile = profileOf(db, session.userId)
  const instName = fProfile.institute || 'Sunfield Institute of Technology'
  const students = Object.values(db.users).filter((u) => u.role === 'student' && profileOf(db, u.id).institute === instName)
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Student profiles</h1>
          <p className="sub">Verified skills, certificates and readiness at a glance.</p>
        </div>
      </div>
      <div className="grid cols-3">
        {students.map((u) => {
          const p = profileOf(db, u.id)
          const a = db.assessments[u.id]
          return (
            <button key={u.id} className="card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setOpen(u.id)}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Avatar name={u.name} src={p.photo} />
                <div style={{ flex: 1 }}>
                  <b>{u.name}</b>
                  <div className="small muted">{p.department} · Year {p.year}</div>
                </div>
                {a && <ScoreRing value={a.overall} size={40} stroke={4.5} />}
              </div>
            </button>
          )
        })}
      </div>
      {open && <StudentProfileModal userId={open} onClose={() => setOpen(null)} />}
    </>
  )
}
