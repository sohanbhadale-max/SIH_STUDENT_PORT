import { useState } from 'react'
import { useStore, verifiedSkills, employability, postingInterests } from '../../lib/store'
import { ALL_SKILLS } from '../../lib/seed'
import { Icon, Badge, Modal, useToast, Empty, StatusBadge, Field, TextInput, TextArea, Select, SkillChips, ScoreRing, Avatar } from '../../components/ui'
import { uid, todayISO, fmtDate } from '../../lib/util'

export function PostingsPage({ kind }) {
  const { db, session, postPosting, updateApplication, scheduleInterview, notify } = useStore()
  const toast = useToast()
  const isJob = kind === 'job'
  const postings = (isJob ? db.jobs : db.internships).filter((p) => p.companyId === session.userId)
  const [showNew, setShowNew] = useState(false)
  const [openPosting, setOpenPosting] = useState(null)
  const [interviewFor, setInterviewFor] = useState(null)
  const [offerFor, setOfferFor] = useState(null)

  const appsFor = (postingId) => db.applications.filter((a) => a.postingId === postingId)

  const shortlist = (app) => setInterviewFor({ app, date: '', time: '10:00', mode: 'Online (video call)', link: '', notes: '' })
  const reject = (app) => {
    updateApplication(app.id, { status: 'rejected' })
    notify(app.applicantId, `Your application for ${(isJob ? db.jobs : db.internships).find((p) => p.id === app.postingId)?.title} was not selected.`, { icon: 'x' })
    toast('Candidate rejected.')
  }

  const saveInterview = () => {
    const { app, ...interview } = interviewFor
    scheduleInterview(app.id, interview)
    toast('Interview scheduled — details synchronized live to candidate & institute.')
    setInterviewFor(null)
  }

  const clearInterview = (app) => {
    const title = (isJob ? db.jobs : db.internships).find((p) => p.id === app.postingId)?.title || 'Role'
    updateApplication(app.id, { status: 'interview_cleared', interviewClearedAt: todayISO() })
    notify(app.applicantId, `Congratulations! You have PASSED & CLEARED your interview for ${title}.`, { icon: 'check' })
    toast(`Interview marked CLEARED! Candidate is now eligible to receive an official ${isJob ? 'Job Offer Letter' : 'Internship Selection'}.`)
  }

  const sendOffer = () => {
    const { app, letter } = offerFor
    updateApplication(app.id, { status: 'offer', offer: { letter, sentAt: todayISO(), response: 'pending' } })
    notify(app.applicantId, `Offer letter received for ${db.jobs.find((p) => p.id === app.postingId)?.title}. Accept or reject it in your Jobs section.`, { icon: 'cert' })
    setOfferFor(null)
    toast('Offer letter sent to the candidate.')
  }

  const selectIntern = (app) => {
    updateApplication(app.id, { status: 'selected' })
    notify(app.applicantId, `Congratulations — you’ve been selected for the internship!`, { icon: 'check' })
    toast('Candidate selected for the internship.')
  }
  const completeIntern = (app) => {
    updateApplication(app.id, { status: 'completed' })
    notify(app.applicantId, `Internship marked complete — added to your profile and resume.`, { icon: 'cert' })
    toast('Internship completed — added to the student’s profile and resume.')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{isJob ? 'Job openings' : 'Internship openings'}</h1>
          <p className="sub">Post new {isJob ? 'roles' : 'internships'}, review applicants, shortlist, interview and send offers.</p>
        </div>
        <button className="btn btn-accent" onClick={() => setShowNew(true)}><Icon name="plus" size={15} /> Post new {isJob ? 'job' : 'internship'}</button>
      </div>

      {postings.length === 0 && <Empty icon="briefcase" title={`No ${isJob ? 'job' : 'internship'} postings yet`} sub="Post your first opening — students see it instantly." action={<button className="btn btn-accent" onClick={() => setShowNew(true)}>Post opening</button>} />}

      {postings.map((p) => {
        const apps = appsFor(p.id)
        const shortlisted = apps.filter((a) => ['shortlisted', 'interview', 'interview_cleared', 'offer', 'accepted', 'selected', 'completed'].includes(a.status))
        return (
          <div key={p.id} className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div>
                <h3>{p.title}</h3>
                <div className="small muted">
                  {p.location} · {isJob ? `${p.salary} · ${p.experience}` : `${p.duration} · ${p.stipend}`} · posted {fmtDate(p.postedAt)}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {p.skills.map((s) => <Badge key={s} tone="outline">{s}</Badge>)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge tone="sky">{apps.length} applicants</Badge>
                <Badge tone="gold">{shortlisted.length} shortlisted</Badge>
                <button className="btn btn-ghost btn-sm" onClick={() => setOpenPosting(openPosting === p.id ? null : p.id)}>
                  {openPosting === p.id ? 'Hide applicants' : 'View applicants'}
                </button>
              </div>
            </div>

            {openPosting === p.id && (
              <div style={{ marginTop: 16 }}>
                {apps.length === 0 && <p className="muted">No applicants yet.</p>}
                {apps.map((app) => {
                  const applicant = db.users[app.applicantId]
                  const prof = app.resumeSnapshot || {}
                  const skills = verifiedSkills(db, app.applicantId)
                  const emp = employability(db, app.applicantId)
                  return (
                    <div key={app.id} style={{ borderTop: '1px solid var(--line)', padding: '14px 0' }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Avatar name={applicant?.name} src={prof.photo} />
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <b>{applicant?.name}</b>
                          <div className="small muted">{prof.degree || prof.eduLevel} · {prof.institute} · applied {fmtDate(app.appliedAt)}</div>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                            {(skills ?? prof.skills ?? []).slice(0, 6).map((s) => <Badge key={s} tone="outline">{s}</Badge>)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <ScoreRing value={emp} size={46} stroke={5} label={`Employability ${emp}`} />
                          <div className="small muted">employability</div>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>

                      {app.interview && (
                        <div style={{ width: '100%', marginTop: 8, padding: '10px 12px', background: 'var(--marigold-soft)', borderRadius: 6, fontSize: 13 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <Icon name="calendar" size={14} /> <b>Scheduled Interview:</b> {app.interview.date} at {app.interview.time} ({app.interview.mode})
                              {app.interview.link && <div style={{ fontSize: 12, marginTop: 2 }}><b>Link/Venue:</b> {app.interview.link}</div>}
                              {app.interview.notes && <div style={{ fontSize: 12, marginTop: 2 }}><b>Notes:</b> {app.interview.notes}</div>}
                            </div>
                            {app.status === 'interview_cleared' ? (
                              <Badge tone="green"><Icon name="check" size={11} /> Interview Cleared</Badge>
                            ) : (
                              <Badge tone="gold">Interview Pending / In Progress</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        {app.status === 'applied' && <>
                          <button className="btn btn-good btn-sm" onClick={() => shortlist(app)}><Icon name="check" size={13} /> Shortlist & schedule interview</button>
                          <button className="btn btn-danger btn-sm" onClick={() => reject(app)}><Icon name="x" size={13} /> Reject candidate</button>
                        </>}

                        {app.status === 'interview' && <>
                          <button className="btn btn-good btn-sm" style={{ fontWeight: 700 }} onClick={() => clearInterview(app)}>
                            <Icon name="check" size={13} /> Pass / Clear Interview
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setInterviewFor({ app, date: app.interview?.date || '', time: app.interview?.time || '10:00', mode: app.interview?.mode || 'Online (video call)', link: app.interview?.link || '', notes: app.interview?.notes || '' })}>
                            <Icon name="calendar" size={13} /> Reschedule interview
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => reject(app)}>
                            <Icon name="x" size={13} /> Reject Candidate
                          </button>
                        </>}

                        {app.status === 'interview_cleared' && <>
                          {isJob ? (
                            <button className="btn btn-accent btn-sm" style={{ fontWeight: 700 }} onClick={() => setOfferFor({ app, letter: `Dear ${applicant?.name},\n\nWe are delighted to inform you that you have cleared the interview rounds!\n\nWe are pleased to offer you the position of ${p.title} at ${db.users[session.userId].name}.\n\nCompensation Package: ${p.salary}\n\nPlease review and respond with your acceptance.\n\nWarm regards,\nHR Team` })}>
                              <Icon name="send" size={13} /> Send Job Offer Letter
                            </button>
                          ) : (
                            <button className="btn btn-good btn-sm" style={{ fontWeight: 700 }} onClick={() => selectIntern(app)}>
                              <Icon name="check" size={13} /> Accept & Select Intern
                            </button>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => reject(app)}>
                            <Icon name="x" size={13} /> Reject Candidate
                          </button>
                        </>}

                        {app.status === 'offer' && <span className="small muted">Job offer sent {fmtDate(app.offer?.sentAt)} — awaiting candidate response.</span>}
                        {app.status === 'selected' && (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Badge tone="green"><Icon name="check" size={11} /> Intern Accepted & Selected</Badge>
                            <button className="btn btn-good btn-sm" onClick={() => completeIntern(app)}><Icon name="check" size={13} /> Mark internship completed</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--bad)' }} onClick={() => reject(app)}>Change decision to Reject</button>
                          </div>
                        )}
                        {app.status === 'accepted' && isJob && <Badge tone="green"><Icon name="check" size={11} /> Candidate Joined Company</Badge>}
                        {app.status === 'completed' && <Badge tone="green"><Icon name="check" size={11} /> Internship Completed & Certified</Badge>}
                        {app.status === 'rejected' && <span className="small muted" style={{ color: 'var(--bad)' }}>Candidate Rejected.</span>}
                        {app.offer?.response === 'accepted' && <Badge tone="green">Accepted your offer</Badge>}
                        {app.offer?.response === 'declined' && <Badge tone="rust">Declined your offer</Badge>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {showNew && <NewPostingModal kind={kind} onClose={() => setShowNew(false)} onSave={(posting) => {
        postPosting(kind, { ...posting, id: uid(), companyId: session.userId, postedAt: todayISO() })
        setShowNew(false)
        toast(`${isJob ? 'Job' : 'Internship'} posted — visible to students now.`)
      }} />}

      {interviewFor && (
        <Modal title="Shortlist — schedule interview" onClose={() => setInterviewFor(null)}>
          <div className="grid cols-2">
            <Field label="Date"><TextInput type="date" value={interviewFor.date} onChange={(e) => setInterviewFor({ ...interviewFor, date: e.target.value })} /></Field>
            <Field label="Time"><TextInput type="time" value={interviewFor.time} onChange={(e) => setInterviewFor({ ...interviewFor, time: e.target.value })} /></Field>
          </div>
          <Field label="Mode">
            <Select value={interviewFor.mode} onChange={(e) => setInterviewFor({ ...interviewFor, mode: e.target.value })}>
              <option>Online (video call)</option>
              <option>On-campus</option>
              <option>At company office</option>
            </Select>
          </Field>
          <Field label="Meeting link / venue"><TextInput value={interviewFor.link} onChange={(e) => setInterviewFor({ ...interviewFor, link: e.target.value })} placeholder="https://meet.example/…" /></Field>
          <Field label="Notes for the candidate"><TextArea value={interviewFor.notes} onChange={(e) => setInterviewFor({ ...interviewFor, notes: e.target.value })} placeholder="e.g. 30-min technical round, keep your resume handy" /></Field>
          <button className="btn btn-accent btn-lg" style={{ width: '100%' }} disabled={!interviewFor.date} onClick={saveInterview}>
            Shortlist & send details <Icon name="send" size={15} />
          </button>
        </Modal>
      )}

      {offerFor && (
        <Modal title="Send offer letter" onClose={() => setOfferFor(null)} wide>
          <p className="small muted">The letter is typed manually by HR and delivered to the candidate’s Jobs section.</p>
          <TextArea style={{ minHeight: 240 }} value={offerFor.letter} onChange={(e) => setOfferFor({ ...offerFor, letter: e.target.value })} />
          <button className="btn btn-accent btn-lg" style={{ width: '100%', marginTop: 12 }} disabled={!offerFor.letter.trim()} onClick={sendOffer}>
            Send offer <Icon name="send" size={15} />
          </button>
        </Modal>
      )}
    </>
  )
}

function NewPostingModal({ kind, onClose, onSave }) {
  const toast = useToast()
  const isJob = kind === 'job'
  const [form, setForm] = useState({
    title: '', post: '', location: '', skills: [], openings: 1, description: '',
    ...(isJob ? { salary: '', experience: '0–2 yrs' } : { duration: '3 months', stipend: '' }),
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const valid = form.title && form.location && form.skills.length > 0

  return (
    <Modal title={`Post new ${isJob ? 'job' : 'internship'}`} onClose={onClose} wide>
      <div className="grid cols-2">
        <Field label="Title"><TextInput value={form.title} onChange={(e) => { set('title', e.target.value); set('post', e.target.value) }} placeholder={isJob ? 'e.g. Software Engineer' : 'e.g. Data Engineering Intern'} /></Field>
        <Field label="Location"><TextInput value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Bengaluru" /></Field>
      </div>
      <div className="grid cols-2">
        {isJob
          ? <>
              <Field label="Salary range"><TextInput value={form.salary} onChange={(e) => set('salary', e.target.value)} placeholder="e.g. 8 – 12 LPA" /></Field>
              <Field label="Experience"><TextInput value={form.experience} onChange={(e) => set('experience', e.target.value)} /></Field>
            </>
          : <>
              <Field label="Duration">
                <Select value={form.duration} onChange={(e) => set('duration', e.target.value)}>
                  {['2 months', '3 months', '4 months', '6 months', '12 months'].map((d) => <option key={d}>{d}</option>)}
                </Select>
              </Field>
              <Field label="Stipend"><TextInput value={form.stipend} onChange={(e) => set('stipend', e.target.value)} placeholder="e.g. ₹20,000/mo" /></Field>
            </>}
      </div>
      <Field label="Openings"><TextInput type="number" min="1" value={form.openings} onChange={(e) => set('openings', Number(e.target.value) || 1)} /></Field>
      <Field label="Required skills" hint="Used for eligibility scoring on the student side.">
        <SkillChips selected={form.skills} all={ALL_SKILLS} onToggle={(s) => set('skills', form.skills.includes(s) ? form.skills.filter((x) => x !== s) : [...form.skills, s])} />
      </Field>
      <Field label="Description"><TextArea value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
      <button className="btn btn-accent btn-lg" style={{ width: '100%' }} disabled={!valid} onClick={() => onSave(form)}>
        Publish {isJob ? 'job' : 'internship'} <Icon name="arrow" size={15} />
      </button>
    </Modal>
  )
}
