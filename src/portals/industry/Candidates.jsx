import { useState } from 'react'
import { useStore, profileOf, candidateMatches, verifiedSkills, appsFor } from '../../lib/store'
import { Avatar, Badge, Modal, ScoreRing, Icon, Empty, TextInput } from '../../components/ui'

export function CandidatesPage() {
  const { db, session } = useStore()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const matches = candidateMatches(db, session.userId)
    .filter((m) => !q || m.name?.toLowerCase().includes(q.toLowerCase()) || (m.profile.skills || []).some((s) => s.toLowerCase().includes(q.toLowerCase())))

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Candidate discovery</h1>
          <p className="sub">Students ranked against your company description and hiring focus areas.</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={15} className="muted" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input className="input" style={{ paddingLeft: 36, width: 240 }} placeholder="Search name or skill…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {matches.length === 0 && <Empty icon="users" title="No candidates found" sub="Try a different search." />}

      <div className="card flush">
        <table className="table">
          <thead><tr><th>Student</th><th>Education</th><th>Verified skills</th><th>Fit score</th><th>Employability</th><th /></tr></thead>
          <tbody>
            {matches.map((m) => {
              const skills = verifiedSkills(db, m.userId) ?? m.profile.skills ?? []
              return (
                <tr key={m.userId} className="clickable" onClick={() => setOpen(m.userId)}>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Avatar name={m.name} src={m.profile.photo} />
                      <div><b>{m.name}</b><div className="small muted">{m.profile.institute}</div></div>
                    </div>
                  </td>
                  <td className="small">{m.profile.degree || m.profile.eduLevel}{m.profile.year ? ` · Year ${m.profile.year}` : ''}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {skills.slice(0, 4).map((s) => <Badge key={s} tone="outline">{s}</Badge>)}
                      {skills.length > 4 && <Badge tone="gray">+{skills.length - 4}</Badge>}
                      {skills.length === 0 && <span className="small muted">Pending assessment</span>}
                    </div>
                  </td>
                  <td><Badge tone={m.score >= 60 ? 'green' : m.score >= 35 ? 'gold' : 'gray'}>{m.score}/100 fit</Badge></td>
                  <td><ScoreRing value={m.employability} size={40} stroke={4.5} /></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setOpen(m.userId) }}>View profile</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {open && <StudentProfileModal userId={open} onClose={() => setOpen(null)} />}
    </>
  )
}

export function StudentProfileModal({ userId, onClose, onRemove }) {
  const { db } = useStore()
  const user = db.users[userId]
  const p = profileOf(db, userId)
  const a = db.assessments[userId]
  const certs = db.enrollments.filter((e) => e.userId === userId && e.status === 'completed')
  const completedInterns = appsFor(db, userId).filter((x) => x.kind === 'internship' && x.status === 'completed')

  return (
    <Modal title="Student profile" onClose={onClose} wide>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <Avatar name={user?.name} src={p.photo} size="lg" />
        <div style={{ flex: 1 }}>
          <h2>{user?.name}</h2>
          <div className="muted">{p.degree || p.eduLevel}{p.institute ? ` · ${p.institute}` : ''}{p.year ? ` · Year ${p.year}` : ''}</div>
          <div className="small muted">{p.email} · {p.phone}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <ScoreRing value={a?.overall ?? 0} size={64} label="Assessment score" />
          <div className="small muted">assessment</div>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginBottom: 14 }}>
        <div><b className="small">Interests</b><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>{(p.interests || []).map((i) => <Badge key={i} tone="gold">{i}</Badge>)}</div></div>
        <div><b className="small">Job interest</b><p style={{ margin: '4px 0 0' }}>{p.jobInterest || '—'}</p></div>
      </div>

      <b className="small">Verified skills</b>
      {a
        ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '6px 0 14px' }}>
            {Object.entries(a.scores).map(([s, v]) => <Badge key={s} tone={v.score >= 70 ? 'green' : v.score >= 40 ? 'gold' : 'rust'}>{s} · {v.score}</Badge>)}
          </div>
        )
        : <p className="muted small" style={{ margin: '6px 0 14px' }}>Skills not yet verified by assessment.</p>}

      {(certs.length > 0 || completedInterns.length > 0) && <>
        <b className="small">Achievements</b>
        <ul className="small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          {certs.map((e) => { const c = db.courses.find((x) => x.id === e.courseId); return <li key={e.id}>Certificate: {c?.title} ({e.certificate.id})</li> })}
          {completedInterns.map((x) => { const i = db.internships.find((y) => y.id === x.postingId); return <li key={x.id}>Completed internship: {i?.title} at {i && db.users[i.companyId]?.name}</li> })}
          {p.placed && <li>Placed at {p.placed.company} ({p.placed.packageLPA} LPA)</li>}
        </ul>
      </>}

      {onRemove && (
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" style={{ color: 'var(--bad)' }} onClick={() => onRemove(userId)}>
            <Icon name="trash" size={15} /> Remove Student Profile
          </button>
        </div>
      )}
    </Modal>
  )
}
