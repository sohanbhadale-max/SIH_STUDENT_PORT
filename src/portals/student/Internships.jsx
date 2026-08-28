import { useEffect } from 'react'
import { useStore, profileOf, eligibleInternships, appsFor, matchScore, postingById } from '../../lib/store'
import { ScoreRing, Icon, Badge, useToast, Empty, StatusBadge } from '../../components/ui'
import { uid, todayISO, fmtDate } from '../../lib/util'

export function InternshipsPage() {
  const { db, session, apply, ignore, notify } = useStore()
  const toast = useToast()
  const id = session.userId
  const assessed = Boolean(db.assessments[id])
  const matches = eligibleInternships(db, id)
  const apps = appsFor(db, id).filter((a) => a.kind === 'internship')

  // eligibility notifications (once per posting)
  useEffect(() => {
    const notified = new Set(db.notifications.filter((n) => n.kind === 'intern-match').map((n) => n.meta?.postingId))
    for (const m of matches.slice(0, 3)) {
      if (!notified.has(m.posting.id)) {
        notify(id, `You meet the eligibility score (${m.score}/${m.posting.minScore} required ${m.posting.minScore}) for ${m.posting.title}.`, { kind: 'intern-match', icon: 'briefcase', meta: { postingId: m.posting.id } })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches.length])

  const onApply = (posting, score) => {
    const app = {
      id: uid(), kind: 'internship', postingId: posting.id, applicantId: id,
      status: 'applied', appliedAt: todayISO(), match: score,
      resumeSnapshot: { name: db.users[id].name, ...profileOf(db, id) },
    }
    apply(app)
    notify(posting.companyId, `${db.users[id].name} applied for ${posting.title} — resume attached (match ${score}/100).`, { icon: 'doc' })
    toast(`Applied — your resume was sent to the company.`)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Internships</h1>
          <p className="sub">Skill-mapped openings — verified by your assessment, education and interests.</p>
        </div>
      </div>

      {!assessed && (
        <div className="notice" style={{ marginBottom: 18 }}>
          <Icon name="target" size={18} />
          <div><b>Assessment pending.</b> Internship matching is verified through your skill assessment — complete it to unlock personalised matches and eligibility alerts.</div>
        </div>
      )}

      <h3 style={{ margin: '6px 0 12px' }}>Matches for you {assessed && <Badge tone="green">{matches.length}</Badge>}</h3>
      {matches.length === 0
        ? <Empty icon="briefcase" title={assessed ? 'No new eligible internships' : 'Matches locked'} sub={assessed ? 'You have applied to (or hidden) all eligible openings. New postings will appear here.' : 'Complete your skill assessment to see verified matches.'} />
        : (
          <div className="grid cols-2" style={{ marginBottom: 28 }}>
            {matches.map(({ posting, score }) => {
              const company = db.users[posting.companyId]
              return (
                <div key={posting.id} className="card">
                  <div style={{ display: 'flex', gap: 14 }}>
                    <ScoreRing value={score} size={60} stroke={6} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 15.5 }}>{posting.title}</h3>
                      <p className="small muted" style={{ marginBottom: 6 }}>{company?.name} · {posting.location}</p>
                      <p className="small" style={{ marginBottom: 6 }}>{posting.duration} · {posting.stipend} · {posting.openings} openings</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {posting.skills.map((s) => <Badge key={s} tone="outline">{s}</Badge>)}
                      </div>
                    </div>
                  </div>
                  <p className="small muted" style={{ margin: '12px 0' }}>{posting.description}</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-accent btn-sm" onClick={() => onApply(posting, score)}>
                      <Icon name="send" size={13} /> Apply — send resume
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => ignore(id, posting.id)}>Ignore</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      <h3 style={{ margin: '18px 0 12px' }}>My applications ({apps.length})</h3>
      {apps.length === 0
        ? <Empty icon="doc" title="No applications yet" sub="Apply to a matched internship above — your resume goes straight to the company." />
        : (
          <div className="card flush">
            <table className="table">
              <thead><tr><th>Internship</th><th>Company</th><th>Match</th><th>Status</th><th>Details</th></tr></thead>
              <tbody>
                {apps.map((app) => {
                  const posting = postingById(db, 'internship', app.postingId)
                  const company = posting && db.users[posting.companyId]
                  return (
                    <tr key={app.id}>
                      <td><b>{posting?.title}</b><div className="small muted">Applied {fmtDate(app.appliedAt)}</div></td>
                      <td>{company?.name}</td>
                      <td><Badge tone={app.match >= (posting?.minScore || 0) ? 'green' : 'gray'}>{app.match}/100</Badge></td>
                      <td><StatusBadge status={app.status} /></td>
                      <td className="small">
                        {app.status === 'applied' && 'Resume sent — awaiting review.'}
                        {app.status === 'shortlisted' && 'Shortlisted! Watch for interview details.'}
                        {app.status === 'interview' && app.interview && (
                          <span>
                            <Badge tone="plum"><Icon name="calendar" size={11} /> {fmtDate(app.interview.date)} · {app.interview.time}</Badge>{' '}
                            {app.interview.mode}{app.interview.link ? ` · ${app.interview.link}` : ''}
                            {app.interview.notes && <div className="muted">{app.interview.notes}</div>}
                          </span>
                        )}
                        {app.status === 'selected' && 'Selected 🎉 The company will confirm completion.'}
                        {app.status === 'completed' && <Badge tone="green"><Icon name="check" size={11} /> Added to profile & resume</Badge>}
                        {app.status === 'rejected' && 'Not selected this time — keep upskilling.'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
    </>
  )
}
