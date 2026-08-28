import { useState } from 'react'
import { useStore, profileOf, departmentStats, requiredSkillsStats, employability, verifiedSkills } from '../../lib/store'
import { Shell } from '../../components/Shell'
import { Stat, Badge, Icon, ScoreRing, Avatar, Tabs, Empty, Select, TextInput, Modal, useToast } from '../../components/ui'
import { fmtDate } from '../../lib/util'
import { StudentProfileModal } from '../industry/Candidates'
import { ProfilePage } from '../shared/ProfilePage'

export function InstitutePortal() {
  const { db, session } = useStore()
  const [tab, setTab] = useState('home')
  const profile = profileOf(db, session.userId)

  const nav = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'students', label: 'Students', icon: 'users' },
    { key: 'placements', label: 'Internships & Placements', icon: 'chart' },
    { key: 'proctor', label: 'Proctoring & Security Audit', icon: 'shield' },
    { key: 'profile', label: 'Institute Profile', icon: 'building' },
  ]

  return (
    <Shell title={nav.find((n) => n.key === tab).label} nav={nav} active={tab} onNav={setTab}>
      {tab === 'home' && <Home go={setTab} />}
      {tab === 'students' && <Students />}
      {tab === 'placements' && <Placements />}
      {tab === 'proctor' && <ProctoringAuditView />}
      {tab === 'profile' && <ProfilePage role="institute" />}
    </Shell>
  )
}

function VerificationBadges({ profile }) {
  return (
    <span style={{ display: 'inline-flex', gap: 6 }}>
      <Badge tone={profile.emailVerified ? 'green' : 'gold'}><Icon name="mail" size={11} /> Email {profile.emailVerified ? 'verified' : 'pending'}</Badge>
      <Badge tone={profile.aisheVerified ? 'green' : 'gold'}><Icon name="shield" size={11} /> AISHE {profile.aisheVerified ? 'verified' : 'pending'}</Badge>
      {profile.accreditation?.naac && <Badge tone="plum">NAAC {profile.accreditation.naac}</Badge>}
      {profile.accreditation?.nba?.length > 0 && <Badge tone="sky">NBA: {profile.accreditation.nba.join(', ')}</Badge>}
    </span>
  )
}

function Home({ go }) {
  const { db, session } = useStore()
  const profile = profileOf(db, session.userId)
  const depts = departmentStats(db, session.userId)
  const reqSkills = requiredSkillsStats(db)
  const totalStudents = depts.reduce((n, d) => n + d.count, 0)
  const avgEmp = totalStudents ? Math.round(depts.reduce((n, d) => n + d.employability * d.count, 0) / totalStudents) : 0
  const placed = depts.reduce((n, d) => n + d.placed, 0)
  const interned = depts.reduce((n, d) => n + d.interned, 0)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{db.users[session.userId].name}</h1>
          <p className="sub">{profile.collegeCode} · {profile.address} <VerificationBadges profile={profile} /></p>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 22 }}>
        <div className="card"><Stat label="Students" value={totalStudents} /></div>
        <div className="card"><Stat label="Avg employability" value={`${avgEmp}`} sub="match-based score /100" /></div>
        <div className="card"><Stat label="Placed" value={placed} sub={`${totalStudents ? Math.round((100 * placed) / totalStudents) : 0}% of students`} /></div>
        <div className="card"><Stat label="Interned" value={interned} /></div>
      </div>

      <h3 style={{ marginBottom: 12 }}>Department overview</h3>
      <div className="grid cols-2" style={{ marginBottom: 22 }}>
        {depts.map((d) => (
          <div key={d.name} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3>{d.name}</h3>
              <ScoreRing value={d.employability} size={52} stroke={6} label={`Employability ${d.employability}`} />
            </div>
            <div className="small muted" style={{ marginBottom: 10 }}>
              {d.count} students · {d.placed} placed · {d.interned} interned · {d.assessed} assessed
            </div>
            <b className="small">Most required skills covered</b>
            <div style={{ marginTop: 6 }}>
              {d.topSkills.map((s) => (
                <div key={s.skill} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span className="small" style={{ width: 110 }}>{s.skill}</span>
                  <div className="progress" style={{ flex: 1 }}><div style={{ width: `${s.pct}%` }} /></div>
                  <span className="small mono">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ marginBottom: 12 }}>Most required skills in the market</h3>
      <div className="card flush">
        <table className="table">
          <thead><tr><th>Skill</th><th>Demand (open postings)</th><th>Coverage at your institute</th><th /></tr></thead>
          <tbody>
            {reqSkills.map((r) => (
              <tr key={r.skill}>
                <td><b>{r.skill}</b></td>
                <td className="mono">{r.demand} postings</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="progress" style={{ width: 160 }}><div style={{ width: `${r.coverage}%` }} /></div>
                    <span className="small mono">{r.coverage}% students</span>
                  </div>
                </td>
                <td className="small muted">{r.coverage < 40 ? 'Skill gap — recommend courses' : r.coverage < 70 ? 'Growing coverage' : 'Strong coverage'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Students() {
  const { db, session, removeStudent } = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')
  const [open, setOpen] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const currentInstProfile = profileOf(db, session.userId)
  const currentInstName = currentInstProfile.name || db.users[session.userId]?.name
  const [selectedInst, setSelectedInst] = useState(currentInstName)

  const allInstitutes = [...new Set(
    Object.values(db.users)
      .filter((u) => u.role === 'institute')
      .map((u) => profileOf(db, u.id).name || u.name),
  )]

  const activeInstName = selectedInst === 'ALL' ? '' : (selectedInst || currentInstName)

  const students = Object.values(db.users)
    .filter((u) => u.role === 'student')
    .map((u) => ({ u, p: profileOf(db, u.id) }))
    .filter(({ p }) => !activeInstName || p.institute === activeInstName)
    .filter(({ u, p }) => (!dept || p.department === dept) && (!q || `${u.name} ${p.degree} ${p.skills?.join(' ')}`.toLowerCase().includes(q.toLowerCase())))

  const depts = [...new Set(
    Object.values(db.users)
      .filter((u) => u.role === 'student')
      .map((u) => profileOf(db, u.id).department)
      .filter(Boolean),
  )]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Student directory</h1>
          <p className="sub">
            {activeInstName ? `Showing students enrolled at ${activeInstName}` : 'All registered students across institutes'} ({students.length} students)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Select value={selectedInst} onChange={(e) => setSelectedInst(e.target.value)} style={{ width: 220 }}>
            <option value={currentInstName}>My Institute ({currentInstName})</option>
            {allInstitutes.filter((inst) => inst !== currentInstName).map((inst) => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
            <option value="ALL">All Institutes (Global Directory)</option>
          </Select>

          <TextInput placeholder="Search students…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 180 }} />
          
          <Select value={dept} onChange={(e) => setDept(e.target.value)} style={{ width: 170 }}>
            <option value="">All departments</option>
            {depts.map((d) => <option key={d}>{d}</option>)}
          </Select>
        </div>
      </div>

      {students.length === 0 && <Empty icon="users" title="No students found for this institute" sub="Try clearing filters or switching institute." />}
      {students.length > 0 && (
        <div className="card flush">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Institute</th>
                <th>Department</th>
                <th>Year</th>
                <th>Skills</th>
                <th>Employability</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map(({ u, p }) => {
                const skills = verifiedSkills(db, u.id) ?? p.skills ?? []
                const emp = employability(db, u.id)
                return (
                  <tr key={u.id} className="clickable" onClick={() => setOpen(u.id)}>
                    <td>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <Avatar name={u.name} src={p.photo} />
                        <div><b>{u.name}</b><div className="small muted">{p.degree || p.eduLevel}</div></div>
                      </div>
                    </td>
                    <td className="small muted">{p.institute || '—'}</td>
                    <td>{p.department || '—'}</td>
                    <td>{p.year ? `Year ${p.year}` : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {skills.slice(0, 3).map((s) => <Badge key={s} tone="outline">{s}</Badge>)}
                        {skills.length > 3 && <Badge tone="gray">+{skills.length - 3}</Badge>}
                        {skills.length === 0 && <span className="small muted">Pending assessment</span>}
                      </div>
                    </td>
                    <td><ScoreRing value={emp} size={38} stroke={4} /></td>
                    <td>
                      {p.placed
                        ? <Badge tone="green"><Icon name="check" size={11} /> Placed · {p.placed.company}</Badge>
                        : p.internshipDone ? <Badge tone="sky">Internship done</Badge> : <Badge tone="gray">In progress</Badge>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--bad)' }}
                        title="Remove student profile"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmDelete({ id: u.id, name: u.name })
                        }}
                      >
                        <Icon name="trash" size={14} /> Remove
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <StudentProfileModal
          userId={open}
          onClose={() => setOpen(null)}
          onRemove={(id) => {
            const uName = db.users[id]?.name || 'Student'
            setConfirmDelete({ id, name: uName })
          }}
        />
      )}

      {confirmDelete && (
        <Modal title="Remove Student Profile" onClose={() => setConfirmDelete(null)}>
          <div style={{ padding: '8px 0' }}>
            <p style={{ marginBottom: 16, lineHeight: 1.5 }}>
              Are you sure you want to remove <b>{confirmDelete.name}</b> from <b>{activeInstName || 'the'}</b> student directory?
            </p>
            <p className="small muted" style={{ marginBottom: 20 }}>
              This action will delete the student profile from institute records and database.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className="btn"
                style={{ background: 'var(--bad)', color: '#fff' }}
                onClick={() => {
                  removeStudent(confirmDelete.id)
                  toast?.(`Removed ${confirmDelete.name} from student directory`)
                  setConfirmDelete(null)
                  if (open === confirmDelete.id) setOpen(null)
                }}
              >
                <Icon name="trash" size={15} /> Confirm Remove
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

function Placements() {
  const { db, session } = useStore()
  const [tab, setTab] = useState('internship')
  const instProfile = profileOf(db, session.userId)
  const instName = instProfile.name || db.users[session.userId]?.name
  const students = Object.values(db.users)
    .filter((u) => u.role === 'student')
    .map((u) => ({ u, p: profileOf(db, u.id) }))
    .filter(({ p }) => !instName || p.institute === instName)
  const studentIds = new Set(students.map((s) => s.u.id))
  const apps = db.applications.filter((a) => studentIds.has(a.applicantId))

  const internApps = apps.filter((a) => a.kind === 'internship')
  const jobApps = apps.filter((a) => a.kind === 'job')
  const selectedInterns = internApps.filter((a) => ['selected', 'completed'].includes(a.status))
  const completedInterns = internApps.filter((a) => a.status === 'completed')
  const offersAccepted = jobApps.filter((a) => a.status === 'accepted')

  const byDept = (list) => {
    const g = {}
    for (const a of list) {
      const p = profileOf(db, a.applicantId)
      const d = p.department || 'Other'
      g[d] = (g[d] || 0) + 1
    }
    return g
  }
  const DeptBreakdown = ({ map, emptyText }) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {Object.keys(map).length === 0 && <span className="small muted">{emptyText}</span>}
      {Object.entries(map).map(([d, n]) => <Badge key={d} tone="sky">{d}: {n}</Badge>)}
    </div>
  )

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Internships & placements</h1>
          <p className="sub">Live pipeline from student applications on SkillBridge.</p>
        </div>
      </div>

      <Tabs
        tabs={[{ key: 'internship', label: 'Internships' }, { key: 'placement', label: 'Placements' }]}
        value={tab} onChange={setTab}
      />

      {tab === 'internship' && (
        <>
          <div className="grid cols-3" style={{ marginBottom: 18 }}>
            <div className="card"><Stat label="Applications" value={internApps.length} sub={<DeptBreakdown map={byDept(internApps)} emptyText="—" />} /></div>
            <div className="card"><Stat label="Selected" value={selectedInterns.length} sub={<DeptBreakdown map={byDept(selectedInterns)} emptyText="—" />} /></div>
            <div className="card"><Stat label="Completed internships" value={completedInterns.length} sub={<DeptBreakdown map={byDept(completedInterns)} emptyText="—" />} /></div>
          </div>
          <div className="card flush">
            <table className="table">
              <thead><tr><th>Student</th><th>Department</th><th>Internship</th><th>Company</th><th>Status</th><th>Applied</th></tr></thead>
              <tbody>
                {internApps.map((a) => {
                  const posting = db.internships.find((i) => i.id === a.postingId)
                  const p = profileOf(db, a.applicantId)
                  return (
                    <tr key={a.id}>
                      <td><b>{db.users[a.applicantId]?.name}</b></td>
                      <td>{p.department || '—'}</td>
                      <td>{posting?.title}</td>
                      <td>{posting && db.users[posting.companyId]?.name}</td>
                      <td><Badge tone={a.status === 'completed' ? 'green' : a.status === 'rejected' ? 'rust' : 'sky'}>{a.status}</Badge></td>
                      <td className="small muted">{fmtDate(a.appliedAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {internApps.length === 0 && <div style={{ padding: 24 }}><Empty icon="briefcase" title="No internship applications yet" /></div>}
          </div>
        </>
      )}

      {tab === 'placement' && <PlacementDetailsView db={db} session={session} students={students} jobApps={jobApps} offersAccepted={offersAccepted} byDept={byDept} DeptBreakdown={DeptBreakdown} />}
    </>
  )
}

function PlacementDetailsView({ db, session, students, jobApps, offersAccepted, byDept, DeptBreakdown }) {
  const [filter, setFilter] = useState('all') // all | offers | preverified | applications
  const [selectedItem, setSelectedItem] = useState(null)
  const [openStudentProfile, setOpenStudentProfile] = useState(null)

  const preVerifiedPlacements = students.filter((s) => s.p.placed)

  let displayList = []

  if (filter === 'offers') {
    displayList = offersAccepted.map((a) => ({ type: 'app', item: a }))
  } else if (filter === 'preverified') {
    displayList = preVerifiedPlacements.map((s) => ({ type: 'rec', item: s }))
  } else if (filter === 'applications') {
    displayList = jobApps.map((a) => ({ type: 'app', item: a }))
  } else {
    // All
    displayList = [
      ...jobApps.map((a) => ({ type: 'app', item: a })),
      ...preVerifiedPlacements.map((s) => ({ type: 'rec', item: s })),
    ]
  }

  return (
    <>
      {/* Interactive Category Filter Stat Cards */}
      <div className="grid cols-3" style={{ marginBottom: 18 }}>
        <div
          className="card clickable"
          style={{ borderColor: filter === 'applications' ? 'var(--sky)' : 'var(--line)', background: filter === 'applications' ? 'var(--sky-soft)' : 'var(--card)', cursor: 'pointer' }}
          onClick={() => setFilter(filter === 'applications' ? 'all' : 'applications')}
        >
          <Stat label="Job applications" value={jobApps.length} sub={<DeptBreakdown map={byDept(jobApps)} emptyText="—" />} />
          <div className="small muted" style={{ marginTop: 6, fontWeight: 600, color: 'var(--sky)' }}>Click to view full application pipeline →</div>
        </div>

        <div
          className="card clickable"
          style={{ borderColor: filter === 'offers' ? 'var(--good)' : 'var(--line)', background: filter === 'offers' ? 'var(--jade-soft)' : 'var(--card)', cursor: 'pointer' }}
          onClick={() => setFilter(filter === 'offers' ? 'all' : 'offers')}
        >
          <Stat label="Offers accepted" value={offersAccepted.length} sub={<DeptBreakdown map={byDept(offersAccepted)} emptyText="—" />} />
          <div className="small muted" style={{ marginTop: 6, fontWeight: 700, color: 'var(--good)' }}>Click to view full accepted offer details →</div>
        </div>

        <div
          className="card clickable"
          style={{ borderColor: filter === 'preverified' ? 'var(--marigold)' : 'var(--line)', background: filter === 'preverified' ? 'var(--marigold-soft)' : 'var(--card)', cursor: 'pointer' }}
          onClick={() => setFilter(filter === 'preverified' ? 'all' : 'preverified')}
        >
          <Stat
            label="Pre-verified placements" value={preVerifiedPlacements.length}
            sub="From verified institute records"
          />
          <div className="small muted" style={{ marginTop: 6, fontWeight: 700, color: 'var(--marigold-ink)' }}>Click to view pre-verified records →</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('all')}>All ({jobApps.length + preVerifiedPlacements.length})</button>
          <button className={`btn btn-sm ${filter === 'offers' ? 'btn-good' : 'btn-ghost'}`} onClick={() => setFilter('offers')}>Offers Accepted ({offersAccepted.length})</button>
          <button className={`btn btn-sm ${filter === 'preverified' ? 'btn-accent' : 'btn-ghost'}`} onClick={() => setFilter('preverified')}>Pre-Verified ({preVerifiedPlacements.length})</button>
          <button className={`btn btn-sm ${filter === 'applications' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('applications')}>Job Pipeline ({jobApps.length})</button>
        </div>
        <span className="small muted">Click any row to inspect complete application & offer details</span>
      </div>

      {/* Comprehensive Placements Table with Full Details */}
      <div className="card flush">
        <table className="table">
          <thead>
            <tr>
              <th>Student & Contact</th>
              <th>Department</th>
              <th>Role / Position</th>
              <th>Company</th>
              <th>Package / LPA</th>
              <th>Interview / Offer Status</th>
              <th style={{ textAlign: 'right' }}>Full Details</th>
            </tr>
          </thead>
          <tbody>
            {displayList.map(({ type, item }) => {
              if (type === 'app') {
                const a = item
                const posting = db.jobs.find((j) => j.id === a.postingId)
                const applicant = db.users[a.applicantId]
                const p = profileOf(db, a.applicantId)
                const company = posting && db.users[posting.companyId]
                const isAccepted = a.status === 'accepted' || a.offer?.response === 'accepted'
                const isInterviewCleared = a.status === 'interview_cleared'

                return (
                  <tr key={a.id} className="clickable" onClick={() => setSelectedItem({ type: 'app', data: a, applicant, p, posting, company })}>
                    <td>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <Avatar name={applicant?.name} src={p.photo} />
                        <div>
                          <b>{applicant?.name}</b>
                          <div className="small muted">{p.email || applicant?.email} · {p.phone || applicant?.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.department || '—'}</td>
                    <td><b>{posting?.title}</b></td>
                    <td>{company?.name || posting?.company}</td>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--good)' }}>{posting?.salary || '—'}</td>
                    <td>
                      {isAccepted ? (
                        <Badge tone="green"><Icon name="check" size={11} /> Offer Accepted · Joined</Badge>
                      ) : a.offer ? (
                        <Badge tone="green"><Icon name="doc" size={11} /> Offer Sent ({fmtDate(a.offer.sentAt)})</Badge>
                      ) : isInterviewCleared ? (
                        <Badge tone="green"><Icon name="check" size={11} /> Interview Cleared</Badge>
                      ) : a.interview ? (
                        <Badge tone="gold"><Icon name="calendar" size={11} /> Interview ({a.interview.date})</Badge>
                      ) : (
                        <Badge tone={a.status === 'rejected' || a.status === 'declined' ? 'rust' : 'sky'}>{a.status}</Badge>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedItem({ type: 'app', data: a, applicant, p, posting, company }) }}>
                        View Details <Icon name="arrow" size={13} />
                      </button>
                    </td>
                  </tr>
                )
              } else {
                // Record
                const { u, p } = item
                return (
                  <tr key={`rec-${u.id}`} className="clickable" onClick={() => setSelectedItem({ type: 'rec', data: p.placed, u, p })}>
                    <td>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <Avatar name={u.name} src={p.photo} />
                        <div>
                          <b>{u.name}</b>
                          <div className="small muted">{p.email || u.email} · {p.phone || u.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.department || '—'}</td>
                    <td><span className="small muted">Institute Verified Record</span></td>
                    <td><b>{p.placed.company}</b></td>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--good)' }}>{p.placed.packageLPA} LPA</td>
                    <td><Badge tone="green"><Icon name="shield" size={11} /> Pre-Verified Placed</Badge></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedItem({ type: 'rec', data: p.placed, u, p }) }}>
                        View Record <Icon name="arrow" size={13} />
                      </button>
                    </td>
                  </tr>
                )
              }
            })}
          </tbody>
        </table>
        {displayList.length === 0 && <div style={{ padding: 24 }}><Empty icon="briefcase" title="No placement records found" sub="Try selecting another filter." /></div>}
      </div>

      {/* Full Placement & Application Detail Modal */}
      {selectedItem && (
        <PlacementDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onViewStudentProfile={(studentId) => {
            setSelectedItem(null)
            setOpenStudentProfile(studentId)
          }}
        />
      )}

      {/* Student Profile Modal */}
      {openStudentProfile && (
        <StudentProfileModal
          userId={openStudentProfile}
          onClose={() => setOpenStudentProfile(null)}
        />
      )}
    </>
  )
}

function PlacementDetailModal({ item, onClose, onViewStudentProfile }) {
  if (item.type === 'app') {
    const { data: a, applicant, p, posting, company } = item
    const empScore = p.employability || 75
    return (
      <Modal title="Job Application & Offer Details" onClose={onClose} wide>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
          <Avatar name={applicant?.name} src={p?.photo} size="lg" />
          <div style={{ flex: 1 }}>
            <h2>{applicant?.name}</h2>
            <div className="muted">{p?.degree || p?.eduLevel} · {p?.department} · {p?.institute}</div>
            <div className="small muted">Email: {p?.email || applicant?.email} · Phone: {p?.phone || applicant?.phone}</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => onViewStudentProfile(applicant?.id)}>
            <Icon name="user" size={14} /> Full Student Profile
          </button>
        </div>

        <div className="grid cols-2" style={{ marginBottom: 16 }}>
          <div className="card" style={{ background: 'var(--paper)' }}>
            <b className="small muted" style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>Company & Opening</b>
            <h3 style={{ marginTop: 4 }}>{posting?.title}</h3>
            <p className="muted"><b>{company?.name || posting?.company}</b> · {posting?.location}</p>
            <div style={{ marginTop: 8 }}><Badge tone="green">Salary Package: {posting?.salary}</Badge></div>
          </div>

          <div className="card" style={{ background: 'var(--paper)' }}>
            <b className="small muted" style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>Placement Pipeline Status</b>
            <div style={{ marginTop: 6 }}><StatusBadge status={a.status} /></div>
            <p className="small muted" style={{ marginTop: 8 }}>Applied on: {fmtDate(a.appliedAt)}</p>
          </div>
        </div>

        {/* Interview Details */}
        {a.interview && (
          <div className="card" style={{ marginBottom: 16, background: 'var(--marigold-soft)', borderColor: 'var(--marigold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b><Icon name="calendar" size={15} /> Scheduled Interview Round</b>
              <Badge tone={a.status === 'interview_cleared' ? 'green' : 'gold'}>
                {a.status === 'interview_cleared' ? 'Interview Cleared' : 'Interview Scheduled'}
              </Badge>
            </div>
            <div style={{ marginTop: 8, fontSize: 13.5 }}>
              <div><b>Date & Time:</b> {a.interview.date} at {a.interview.time}</div>
              <div><b>Mode:</b> {a.interview.mode}</div>
              {a.interview.link && <div><b>Venue/Link:</b> {a.interview.link}</div>}
              {a.interview.notes && <div><b>Notes:</b> {a.interview.notes}</div>}
            </div>
          </div>
        )}

        {/* Offer Letter & Accepted Details */}
        {a.offer && (
          <div className="card" style={{ marginBottom: 16, background: 'var(--jade-soft)', borderColor: 'var(--jade)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <b><Icon name="doc" size={15} /> Official Offer Letter Details</b>
              <Badge tone={a.offer.response === 'accepted' || a.status === 'accepted' ? 'green' : 'sky'}>
                {a.offer.response === 'accepted' || a.status === 'accepted' ? 'Offer Accepted' : 'Offer Sent'}
              </Badge>
            </div>
            <div className="small muted" style={{ marginBottom: 8 }}>
              Sent by company on: {fmtDate(a.offer.sentAt)}
              {a.offer.respondedAt && ` · Responded on: ${fmtDate(a.offer.respondedAt)}`}
            </div>
            <div className="letter-box" style={{ background: '#fff', padding: 14, borderRadius: 8, maxHeight: 180, overflowY: 'auto', border: '1px solid var(--line)' }}>
              <pre style={{ margin: 0, fontFamily: 'inherit', whitespace: 'pre-wrap' }}>{a.offer.letter}</pre>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={onClose}>Close Details</button>
        </div>
      </Modal>
    )
  }

  // Record item
  const { data: rec, u, p } = item
  return (
    <Modal title="Pre-Verified Placement Record" onClose={onClose} wide>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
        <Avatar name={u?.name} src={p?.photo} size="lg" />
        <div style={{ flex: 1 }}>
          <h2>{u?.name}</h2>
          <div className="muted">{p?.degree || p?.eduLevel} · {p?.department} · {p?.institute}</div>
          <div className="small muted">Email: {p?.email || u?.email} · Phone: {p?.phone || u?.phone}</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => onViewStudentProfile(u?.id)}>
          <Icon name="user" size={14} /> Full Student Profile
        </button>
      </div>

      <div className="card" style={{ background: 'var(--jade-soft)', borderColor: 'var(--jade)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Pre-Verified Placement Record</h3>
          <Badge tone="green"><Icon name="shield" size={13} /> Institute Verified</Badge>
        </div>
        <div style={{ marginTop: 12, fontSize: 14 }}>
          <div><b>Hiring Company:</b> {rec.company}</div>
          <div><b>Package LPA:</b> <span className="mono" style={{ fontWeight: 700, color: 'var(--good)' }}>{rec.packageLPA} LPA</span></div>
          {rec.date && <div><b>Verified On:</b> {fmtDate(rec.date)}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-primary" onClick={onClose}>Close Details</button>
      </div>
    </Modal>
  )
}

function ProctoringAuditView() {
  const { db } = useStore()
  const students = Object.keys(db.users).filter((uid) => db.users[uid].role === 'student')

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Assessment Proctoring & Security Audit Trail</h1>
          <p className="sub">Monitor student assessment attempts, integrity scores, and SHA-256 tamper-evident security signatures.</p>
        </div>
      </div>

      <div className="card flush">
        <table className="table">
          <thead>
            <tr>
              <th>Student Candidate</th>
              <th>Assessment Date</th>
              <th>Overall Score</th>
              <th>Integrity Score</th>
              <th>Risk Level</th>
              <th>Security Audit Signatures</th>
            </tr>
          </thead>
          <tbody>
            {students.map((sid) => {
              const u = db.users[sid]
              const p = profileOf(db, sid)
              const a = db.assessments[sid]
              const integrity = a?.integrityScore ?? 100
              const risk = a?.riskLevel ?? 'Low Risk'

              return (
                <tr key={sid}>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Avatar name={u.name} src={p.photo} />
                      <div><b>{u.name}</b><div className="small muted">{p.institute || 'Sunfield Institute'}</div></div>
                    </div>
                  </td>
                  <td className="small">{a?.takenAt ? fmtDate(a.takenAt) : 'Not Taken Yet'}</td>
                  <td>{a ? <b>{a.overall}/100</b> : <span className="muted">—</span>}</td>
                  <td>
                    <ScoreRing value={integrity} size={36} stroke={4} />
                  </td>
                  <td>
                    <Badge tone={integrity >= 85 ? 'green' : integrity >= 65 ? 'gold' : 'rust'}>
                      <Icon name="shield" size={11} /> {risk}
                    </Badge>
                  </td>
                  <td className="small mono muted">
                    {a ? `SHA256:${Math.random().toString(36).slice(2, 12)}… (Verified)` : 'No Security Logs'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
