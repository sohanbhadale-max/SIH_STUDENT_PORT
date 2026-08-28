import { useMemo, useState } from 'react'
import { useStore, profileOf, appsFor, postingById } from '../../lib/store'
import { Icon, Badge, Modal, useToast, Empty, StatusBadge, Tabs, TextInput, Select } from '../../components/ui'
import { uid, todayISO, fmtDate } from '../../lib/util'

export function JobsPage() {
  const { db, session, apply, updateApplication, notify } = useStore()
  const toast = useToast()
  const id = session.userId
  const [tab, setTab] = useState('search')
  const [query, setQuery] = useState('')
  const [fLocation, setFLocation] = useState('')
  const [fCompany, setFCompany] = useState('')
  const [fPost, setFPost] = useState('')
  const [openJob, setOpenJob] = useState(null)

  const apps = appsFor(db, id).filter((a) => a.kind === 'job')
  const appliedIds = new Set(apps.map((a) => a.postingId))
  const acceptedOffer = apps.find((a) => a.offer?.response === 'accepted')

  const locations = [...new Set(db.jobs.map((j) => j.location))]
  const companies = [...new Set(db.jobs.map((j) => db.users[j.companyId]?.name))]
  const posts = [...new Set(db.jobs.map((j) => j.post))]

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return db.jobs.filter((j) => {
      if (fLocation && j.location !== fLocation) return false
      if (fCompany && db.users[j.companyId]?.name !== fCompany) return false
      if (fPost && j.post !== fPost) return false
      if (q && !`${j.title} ${j.description} ${j.skills.join(' ')} ${db.users[j.companyId]?.name}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [db, query, fLocation, fCompany, fPost])

  const onApply = (job) => {
    const app = {
      id: uid(), kind: 'job', postingId: job.id, applicantId: id,
      status: 'applied', appliedAt: todayISO(),
      resumeSnapshot: { name: db.users[id].name, ...profileOf(db, id) },
    }
    apply(app)
    notify(job.companyId, `${db.users[id].name} applied for ${job.title}.`, { icon: 'doc' })
    toast(`Applied to ${job.title} — added to your applied jobs.`)
    setOpenJob(null)
    setTab('applied')
  }

  const respondOffer = (app, accept) => {
    updateApplication(app.id, {
      status: accept ? 'accepted' : 'declined',
      offer: { ...app.offer, response: accept ? 'accepted' : 'declined', respondedAt: todayISO() },
    })
    const job = postingById(db, 'job', app.postingId)
    notify(job.companyId, `${db.users[id].name} ${accept ? 'ACCEPTED' : 'declined'} the offer for ${job.title}.`, { icon: accept ? 'check' : 'x' })
    toast(accept ? 'Congratulations — offer accepted! Other offers are now locked.' : 'Offer declined.')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Jobs</h1>
          <p className="sub">Search openings from verified companies.</p>
        </div>
      </div>

      <Tabs
        tabs={[{ key: 'search', label: 'Search jobs' }, { key: 'applied', label: 'Applied jobs', count: apps.length }]}
        value={tab} onChange={setTab}
      />

      {tab === 'search' && (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="grid cols-4" style={{ gap: 10 }}>
              <div style={{ position: 'relative', gridColumn: 'span 1' }}>
                <Icon name="search" size={15} className="muted" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input className="input" style={{ paddingLeft: 36 }} placeholder="Search jobs…" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <Select value={fLocation} onChange={(e) => setFLocation(e.target.value)}>
                <option value="">Location: All</option>
                {locations.map((l) => <option key={l}>{l}</option>)}
              </Select>
              <Select value={fCompany} onChange={(e) => setFCompany(e.target.value)}>
                <option value="">Company: All</option>
                {companies.map((c) => <option key={c}>{c}</option>)}
              </Select>
              <Select value={fPost} onChange={(e) => setFPost(e.target.value)}>
                <option value="">Post: All</option>
                {posts.map((p) => <option key={p}>{p}</option>)}
              </Select>
            </div>
          </div>

          {results.length === 0 && <Empty icon="search" title="No jobs match" sub="Try clearing a filter or two." />}
          {results.map((job) => {
            const company = db.users[job.companyId]
            const applied = appliedIds.has(job.id)
            return (
              <button
                key={job.id} className="card" onClick={() => setOpenJob(job)}
                style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 12, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div className="avatar" style={{ borderRadius: 12 }}>{company?.name?.[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 15.5 }}>{job.title}</h3>
                      {applied && <Badge tone="sky">Applied</Badge>}
                    </div>
                    <div className="small muted">{company?.name} · {job.location} · {job.salary} · {job.experience}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {job.skills.slice(0, 3).map((s) => <Badge key={s} tone="outline">{s}</Badge>)}
                  </div>
                </div>
              </button>
            )
          })}
        </>
      )}

      {tab === 'applied' && (
        <>
          {acceptedOffer && (
            <div className="notice success" style={{ marginBottom: 16 }}>
              <Icon name="check" size={18} />
              <div>You accepted the offer from <b>{db.users[postingById(db, 'job', acceptedOffer.postingId)?.companyId]?.name}</b>. All other offers are locked.</div>
            </div>
          )}
          {apps.length === 0 && <Empty icon="doc" title="No applications yet" sub="Search jobs and apply — your applications and offers appear here." />}
          {apps.map((app) => {
            const job = postingById(db, 'job', app.postingId)
            const company = job && db.users[job.companyId]
            const locked = acceptedOffer && acceptedOffer.id !== app.id
            const offerPending = app.offer && (!app.offer.response || app.offer.response === 'pending')
            return (
              <div key={app.id} className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontSize: 15.5 }}>{job?.title}</h3>
                    <div className="small muted">{company?.name} · {job?.location} · applied {fmtDate(app.appliedAt)}</div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                {app.status === 'interview' && app.interview && (
                  <div className="notice info" style={{ marginTop: 12 }}>
                    <Icon name="calendar" size={16} />
                    <div><b>Interview:</b> {fmtDate(app.interview.date)} at {app.interview.time} · {app.interview.mode}{app.interview.link ? ` · ${app.interview.link}` : ''}{app.interview.notes ? ` — ${app.interview.notes}` : ''}</div>
                  </div>
                )}

                {app.offer && (
                  <div style={{ marginTop: 12 }}>
                    <div className="small muted" style={{ marginBottom: 6 }}>Offer letter from {company?.name} · {fmtDate(app.offer.sentAt)}</div>
                    <div className="letter-box" style={{ maxHeight: 160, overflowY: 'auto' }}>{app.offer.letter}</div>
                    {offerPending && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                        <button className="btn btn-good" disabled={Boolean(locked)} onClick={() => respondOffer(app, true)}>
                          <Icon name="check" size={14} /> Accept offer
                        </button>
                        <button className="btn btn-danger" disabled={Boolean(locked)} onClick={() => respondOffer(app, false)}>
                          <Icon name="x" size={14} /> Reject
                        </button>
                        {locked && <span className="small muted" style={{ alignSelf: 'center' }}>Locked — you already accepted another offer.</span>}
                      </div>
                    )}
                    {app.offer.response === 'accepted' && <Badge tone="green"><Icon name="check" size={11} /> You accepted this offer</Badge>}
                    {app.offer.response === 'declined' && <Badge tone="rust">You declined this offer</Badge>}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {openJob && (
        <Modal title={openJob.title} onClose={() => setOpenJob(null)} wide>
          <p className="muted">{db.users[openJob.companyId]?.name} · <Icon name="pin" size={13} /> {openJob.location} · {openJob.salary} · {openJob.experience}</p>
          <p style={{ marginTop: 12 }}>{openJob.description}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0' }}>
            {openJob.skills.map((s) => <Badge key={s} tone="outline">{s}</Badge>)}
          </div>
          <p className="small muted">{openJob.openings} openings · posted {fmtDate(openJob.postedAt)}</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <button className="btn btn-accent btn-lg" disabled={appliedIds.has(openJob.id)} onClick={() => onApply(openJob)}>
              {appliedIds.has(openJob.id) ? 'Already applied' : <>Apply <Icon name="arrow" size={15} /></>}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
