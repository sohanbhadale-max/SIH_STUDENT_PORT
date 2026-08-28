import { useState } from 'react'
import { useStore, profileOf, verifiedSkills, appsFor } from '../../lib/store'
import { Field, TextArea, TextInput, Icon, useToast, Badge } from '../../components/ui'
import { fmtDate } from '../../lib/util'

export function ResumePage() {
  const { db, session, saveProfile } = useStore()
  const toast = useToast()
  const id = session.userId
  const profile = profileOf(db, id)
  const a = db.assessments[id]
  const apps = appsFor(db, id)
  const completedInternships = apps.filter((x) => x.kind === 'internship' && (x.status === 'completed'))
  const certs = db.enrollments.filter((e) => e.userId === id && e.status === 'completed')
  const [docs, setDocs] = useState(profile.resumeDocs || [])
  const [docName, setDocName] = useState('')

  const addDoc = () => {
    if (!docName.trim()) return
    const next = [...docs, { id: Math.random().toString(36).slice(2), name: docName.trim(), addedAt: new Date().toISOString() }]
    setDocs(next)
    saveProfile(id, { resumeDocs: next })
    setDocName('')
    toast('Document attached to resume.')
  }

  const removeDoc = (did) => {
    const next = docs.filter((d) => d.id !== did)
    setDocs(next)
    saveProfile(id, { resumeDocs: next })
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Resume</h1>
          <p className="sub">Auto-filled from your profile — edit the summary, attach documents, and print.</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}><Icon name="doc" size={15} /> Print / Save PDF</button>
      </div>

      {!a && (
        <div className="notice" style={{ marginBottom: 16 }}>
          <Icon name="target" size={18} />
          <div>Skills appear on your resume only after the skill assessment — your claimed skills are currently hidden.</div>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '340px 1fr', alignItems: 'start' }}>
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <h3 style={{ marginBottom: 10 }}>Career summary</h3>
            <TextArea
              value={profile.summary || ''}
              placeholder="Two lines about what you build and what you're looking for…"
              onChange={(e) => saveProfile(id, { summary: e.target.value })}
            />
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}>Documents</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <TextInput placeholder="e.g. 10th marks card, ID card…" value={docName} onChange={(e) => setDocName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addDoc()} />
              <button className="btn btn-accent btn-sm" onClick={addDoc}><Icon name="plus" size={13} /></button>
            </div>
            {docs.length === 0 && <p className="small muted">No documents attached.</p>}
            {docs.map((d) => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
                <span className="small"><Icon name="doc" size={13} className="muted" /> {d.name}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => removeDoc(d.id)}><Icon name="x" size={12} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="resume-sheet print-area">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)' }}>{db.users[id]?.name ?? profile.name}</h2>
              <div className="muted">{profile.email || db.users[id]?.email} · {profile.phone || db.users[id]?.phone}</div>
              <div className="muted">{profile.institute}{profile.age ? ` · Age ${profile.age}` : ''}</div>
            </div>
            {profile.photo && <img src={profile.photo} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />}
          </div>
          {profile.summary && <p style={{ marginTop: 10 }}>{profile.summary}</p>}

          <h4>Education</h4>
          <p>{profile.degree || profile.eduLevel}{profile.eduInstitution ? ` — ${profile.eduInstitution}` : ''}</p>
          {profile.jobInterest && <p className="muted">Target role: {profile.jobInterest}</p>}

          <h4>Skills {a ? '(verified by assessment)' : ''}</h4>
          {a
            ? Object.entries(a.scores).map(([s, v]) => <span key={s} className="badge outline" style={{ margin: '0 6px 6px 0' }}>{s} · {v.level} ({v.score})</span>)
            : <p className="muted">Pending skill assessment.</p>}

          <h4>Certificates</h4>
          {certs.length === 0 && <p className="muted">None yet.</p>}
          {certs.map((e) => {
            const c = db.courses.find((x) => x.id === e.courseId)
            return <p key={e.id}>{c?.title} — {e.certificate.id}, issued {fmtDate(e.certificate.issuedAt)}</p>
          })}

          <h4>Internships</h4>
          {completedInternships.length === 0 && <p className="muted">None completed yet.</p>}
          {completedInternships.map((x) => {
            const p = db.internships.find((i) => i.id === x.postingId)
            const co = p && db.users[p.companyId]
            return <p key={x.id}>{p?.title} — {co?.name} ({p?.duration})</p>
          })}

          <h4>Documents attached</h4>
          {docs.length === 0 ? <p className="muted">None.</p> : docs.map((d) => <p key={d.id}>{d.name}</p>)}
        </div>
      </div>
    </>
  )
}
