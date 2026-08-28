import { useMemo, useState } from 'react'
import { uid, todayISO } from '../lib/util'
import { useStore } from '../lib/store'
import { ALL_SKILLS, DEGREES, EDU_LEVELS, INTEREST_AREAS } from '../lib/seed'
import { Field, TextInput, Select, TextArea, Icon, SkillChips, useToast } from '../components/ui'
import { AuthHeroSlideshow } from './Auth'

const blank = {
  student: { name: '', age: '', email: '', phone: '', password: '', photo: null, eduLevel: 'Bachelor’s Degree', eduInstitution: '', degree: '', institute: '', interests: [], jobInterest: '', skills: [] },
  faculty: { name: '', email: '', phone: '', password: '', department: '', experience: '', papers: [] },
  institute: { name: '', email: '', phone: '', password: '', address: '', collegeCode: '', accreditation: { naac: '', nba: [] }, aisheId: '', emailVerified: false, aisheVerified: false },
  industry: { name: '', email: '', phone: '', password: '', address: '', cin: '', cinVerified: false, description: '', tags: [] },
}

export function ProfileWizard({ role, onBack, initial, onSave, compact = false }) {
  const { createUser } = useStore()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initial ? { ...blank[role], ...initial } : blank[role])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const editing = Boolean(initial)

  const steps = useMemo(() => {
    if (role === 'student') return ['Basics', 'Education', 'Interests & skills', 'Review']
    if (role === 'institute') return ['Institute details', 'Verification', 'Review']
    if (role === 'industry') return ['Company details', 'Verification & profile', 'Review']
    return ['Your details', 'Review']
  }, [role])

  const finish = () => {
    if (editing) { onSave?.(form); return }
    const id = `u-${uid()}`
    const user = { id, role, name: form.name, email: form.email, phone: form.phone, password: form.password || 'password123', createdAt: todayISO() }
    createUser(user, form)
    toast(`Welcome to SkillBridge, ${form.name.split(' ')[0]}!`)
  }

  const inner = (
    <>
      {!editing && !compact && (
          <div className="step-track">
            {steps.map((s, i) => (
              <div key={s} className={`step ${i < step ? 'done' : i === step ? 'now' : ''}`}>{s}</div>
            ))}
          </div>
        )}

        <div className="card" style={{ marginBottom: 18 }}>
          {role === 'student' && (editing
            ? <>
                <StudentStep step={0} form={form} set={set} />
                <hr className="divider" />
                <StudentStep step={1} form={form} set={set} />
                <hr className="divider" />
                <StudentStep step={2} form={form} set={set} />
              </>
            : <StudentStep step={step} form={form} set={set} />)}
          {role === 'faculty' && <FacultyStep step={0} form={form} set={set} />}
          {role === 'institute' && (editing
            ? <>
                <InstituteStep step={0} form={form} set={set} />
                <hr className="divider" />
                <InstituteStep step={1} form={form} set={set} />
              </>
            : <InstituteStep step={step} form={form} set={set} />)}
          {role === 'industry' && (editing
            ? <>
                <IndustryStep step={0} form={form} set={set} />
                <hr className="divider" />
                <IndustryStep step={1} form={form} set={set} />
              </>
            : <IndustryStep step={step} form={form} set={set} />)}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={step === 0 ? onBack : () => setStep(step - 1)}>← Back</button>
          <div style={{ flex: 1 }} />
          {!editing && step < steps.length - 1 && (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Continue →</button>
          )}
          {(editing || step === steps.length - 1) && (
            <button className="btn btn-accent btn-lg" onClick={finish}>
              {editing ? 'Save profile' : 'Enter portal'} <Icon name="arrow" size={16} />
            </button>
          )}
        </div>
    </>
  )

  if (compact) return <div>{inner}</div>

  const heroSub =
    role === 'student' ? 'Your profile powers internship matching, course recommendations and your resume. Skills become visible only after you complete a skill assessment.'
    : role === 'faculty' ? 'Tell students and institutes who you are. Experience and research papers are optional.'
    : role === 'institute' ? 'We verify institutes via institutional email OTP and AISHE records before unlocking student analytics.'
    : 'We verify companies using the CIN so students only see genuine employers.'

  return (
    <div className="auth-wrap">
      <AuthHeroSlideshow
        customTitle={`Let’s set up your ${{ student: 'student', faculty: 'faculty', institute: 'institute', industry: 'company' }[role]} profile.`}
        customSub={heroSub}
        footText={`${steps.length} quick registration steps`}
      />
      <div className="auth-panel" style={{ justifyContent: 'flex-start', paddingTop: 40, overflowY: 'auto' }}>
        {inner}
      </div>
    </div>
  )
}

// ---------------- student ----------------
function StudentStep({ step, form, set }) {
  if (step === 0) return (
    <>
      <h2 style={{ marginBottom: 14 }}>About you</h2>
      <div className="grid cols-2">
        <Field label="Full name"><TextInput value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Priya Sharma" /></Field>
        <Field label="Age"><TextInput type="number" min="15" max="60" value={form.age} onChange={(e) => set('age', e.target.value)} placeholder="21" /></Field>
        <Field label="Email"><TextInput type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@college.edu.in" /></Field>
        <Field label="Contact number"><TextInput value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" /></Field>
      </div>
      <Field label="Account Password"><TextInput type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Set a password for login (e.g. ••••••••)" /></Field>
      <Field label="Photo (optional)" hint="Shows on your profile and resume — leave empty to use initials.">
        <input
          type="file" accept="image/*" className="input"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            const rd = new FileReader()
            rd.onload = () => set('photo', rd.result)
            rd.readAsDataURL(f)
          }}
        />
      </Field>
      {form.photo && <img src={form.photo} alt="preview" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />}
    </>
  )
  if (step === 1) return (
    <>
      <h2 style={{ marginBottom: 14 }}>Education</h2>
      <Field label="Highest qualification">
        <Select value={form.eduLevel} onChange={(e) => set('eduLevel', e.target.value)}>
          {EDU_LEVELS.map((l) => <option key={l}>{l}</option>)}
        </Select>
      </Field>
      {form.eduLevel === 'Bachelor’s Degree' && (
        <Field label="Degree category">
          <Select value={form.degree} onChange={(e) => set('degree', e.target.value)}>
            <option value="">Select degree…</option>
            {DEGREES.map((d) => <option key={d}>{d}</option>)}
          </Select>
        </Field>
      )}
      <Field label={form.eduLevel === 'School (SSLC/10th)' ? 'School name' : 'Institution / college name'}>
        <TextInput value={form.eduInstitution} onChange={(e) => set('eduInstitution', e.target.value)} placeholder="e.g. Sunfield Institute of Technology" />
      </Field>
      <Field label="Institute on SkillBridge" hint="Used for your institute dashboard — start typing to match, or leave as your college name.">
        <TextInput value={form.institute} onChange={(e) => set('institute', e.target.value)} placeholder="e.g. Sunfield Institute of Technology" />
      </Field>
    </>
  )
  if (step === 2) return (
    <>
      <h2 style={{ marginBottom: 14 }}>Interests & skills</h2>
      <Field label="Basic interests (career-related)">
        <SkillChips
          selected={form.interests} all={INTEREST_AREAS}
          onToggle={(s) => set('interests', form.interests.includes(s) ? form.interests.filter((x) => x !== s) : [...form.interests, s])}
        />
      </Field>
      {form.eduLevel === 'Bachelor’s Degree' && (
        <Field label="Job interest" hint="What role are you aiming for after your degree?">
          <TextInput value={form.jobInterest} onChange={(e) => set('jobInterest', e.target.value)} placeholder="e.g. Software Engineer, Data Analyst" />
        </Field>
      )}
      <Field label="Skills you claim" hint="These stay hidden from your profile until you complete the skill assessment.">
        <SkillChips
          selected={form.skills} all={ALL_SKILLS}
          onToggle={(s) => set('skills', form.skills.includes(s) ? form.skills.filter((x) => x !== s) : [...form.skills, s])}
        />
      </Field>
    </>
  )
  return (
    <>
      <h2 style={{ marginBottom: 14 }}>Review</h2>
      <p><b>{form.name || '—'}</b>, {form.age || '—'} · {form.email || '—'} · {form.phone || '—'}</p>
      <p className="muted">{form.eduLevel}{form.degree ? ` — ${form.degree}` : ''} at {form.eduInstitution || '—'}</p>
      <p className="muted">Interests: {form.interests.join(', ') || '—'}{form.jobInterest ? ` · Aiming for: ${form.jobInterest}` : ''}</p>
      <p className="muted">Claimed skills: {form.skills.join(', ') || '—'}</p>
      <div className="notice" style={{ marginTop: 12 }}>
        <Icon name="shield" size={18} />
        <div>Your claimed skills will appear on your profile <b>only after you complete a skill assessment</b>. You can skip it and take it later — we’ll remind you.</div>
      </div>
    </>
  )
}

// ---------------- faculty ----------------
function FacultyStep({ step, form, set }) {
  if (step === 0) return (
    <>
      <h2 style={{ marginBottom: 14 }}>About you</h2>
      <div className="grid cols-2">
        <Field label="Full name"><TextInput value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Dr. Meera Krishnan" /></Field>
        <Field label="Department"><TextInput value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="e.g. Computer Science" /></Field>
        <Field label="Email"><TextInput type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Contact number"><TextInput value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
      </div>
      <Field label="Account Password"><TextInput type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Set password for login" /></Field>
      <Field label="Experience (optional)"><TextInput value={form.experience} onChange={(e) => set('experience', e.target.value)} placeholder="e.g. 10 years — Machine Learning, Databases" /></Field>
      <Field label="Research papers (optional)" hint="Add links with a one-line description.">
        {(form.papers || []).map((p, i) => (
          <div key={i} className="grid cols-2" style={{ marginBottom: 8 }}>
            <TextInput placeholder="Paper title / link" value={p.title} onChange={(e) => set('papers', form.papers.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
            <div style={{ display: 'flex', gap: 6 }}>
              <TextInput placeholder="Short description" value={p.detail} onChange={(e) => set('papers', form.papers.map((x, j) => j === i ? { ...x, detail: e.target.value } : x))} />
              <button className="btn btn-ghost btn-sm" onClick={() => set('papers', form.papers.filter((_, j) => j !== i))}><Icon name="x" size={13} /></button>
            </div>
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={() => set('papers', [...(form.papers || []), { title: '', detail: '' }])}>
          <Icon name="plus" size={13} /> Add paper
        </button>
      </Field>
    </>
  )
  return (
    <>
      <h2 style={{ marginBottom: 14 }}>Review</h2>
      <p><b>{form.name || '—'}</b> · {form.department || '—'}</p>
      <p className="muted">{form.email || '—'} · {form.phone || '—'}</p>
      <p className="muted">{form.experience || 'No experience listed'}</p>
      {(form.papers || []).filter((p) => p.title).map((p, i) => <p key={i} className="small">📄 {p.title} — {p.detail}</p>)}
    </>
  )
}

// ---------------- institute ----------------
function InstituteStep({ step, form, set }) {
  const toast = useToast()
  const [otp, setOtp] = useState(null)
  const [otpInput, setOtpInput] = useState('')
  const [checking, setChecking] = useState(false)

  if (step === 0) return (
    <>
      <h2 style={{ marginBottom: 14 }}>Institute details</h2>
      <div className="grid cols-2">
        <Field label="Institute name"><TextInput value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Sunfield Institute of Technology" /></Field>
        <Field label="College code"><TextInput value={form.collegeCode} onChange={(e) => set('collegeCode', e.target.value)} placeholder="e.g. SIT-204" /></Field>
      </div>
      <Field label="Address"><TextInput value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
      <div className="grid cols-2">
        <Field label="Institutional email" hint="We’ll send an OTP to verify this domain.">
          <TextInput type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="registrar@yourcollege.edu.in" />
        </Field>
        <Field label="Contact number"><TextInput value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
      </div>
      <Field label="Account Password"><TextInput type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Set password for institute login" /></Field>
    </>
  )
  if (step === 1) return (
    <>
      <h2 style={{ marginBottom: 14 }}>Accreditation & verification</h2>
      <div className="grid cols-2">
        <Field label="NAAC grade">
          <Select value={form.accreditation.naac} onChange={(e) => set('accreditation', { ...form.accreditation, naac: e.target.value })}>
            <option value="">Select…</option>
            {['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C'].map((g) => <option key={g}>{g}</option>)}
          </Select>
        </Field>
        <Field label="NBA-accredited branches">
          <SkillChips
            selected={form.accreditation.nba} all={['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'IT']}
            onToggle={(s) => set('accreditation', { ...form.accreditation, nba: form.accreditation.nba.includes(s) ? form.accreditation.nba.filter((x) => x !== s) : [...form.accreditation.nba, s] })}
          />
        </Field>
      </div>

      <div className="card" style={{ background: 'var(--paper)', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <b>Email verification</b>
            <p className="small muted" style={{ marginBottom: 0 }}>OTP is sent to {form.email || 'your institutional email'}.</p>
          </div>
          {form.emailVerified
            ? <span className="badge green"><Icon name="check" size={12} /> Verified</span>
            : !otp
              ? <button className="btn btn-primary btn-sm" onClick={() => { const code = String(Math.floor(100000 + Math.random() * 899999)); setOtp(code); toast(`Demo OTP sent to ${form.email || 'inbox'}: ${code}`) }}>Send OTP</button>
              : (
                <span style={{ display: 'flex', gap: 6 }}>
                  <input className="input" style={{ width: 110 }} placeholder="6-digit OTP" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} />
                  <button className="btn btn-good btn-sm" onClick={() => { if (otpInput === otp) { set('emailVerified', true); toast('Institutional email verified.') } else toast('Incorrect OTP — try again.') }}>Verify</button>
                </span>
              )}
        </div>
      </div>

      <div className="card" style={{ background: 'var(--paper)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <b>AISHE record</b>
            <Field label="AISHE ID" className="small" hint="e.g. I-20102 — checked against the AISHE registry (simulated).">
              <TextInput value={form.aisheId} onChange={(e) => set('aisheId', e.target.value)} placeholder="I-XXXXX" />
            </Field>
          </div>
          {form.aisheVerified
            ? <span className="badge green"><Icon name="check" size={12} /> AISHE verified</span>
            : <button className="btn btn-primary btn-sm" disabled={!form.aisheId || checking} onClick={() => { setChecking(true); setTimeout(() => { set('aisheVerified', true); setChecking(false); toast(`AISHE record ${form.aisheId} verified.`) }, 900) }}>{checking ? 'Checking…' : 'Verify AISHE'}</button>}
        </div>
      </div>
    </>
  )
  return (
    <>
      <h2 style={{ marginBottom: 14 }}>Review</h2>
      <p><b>{form.name || '—'}</b> ({form.collegeCode || '—'})</p>
      <p className="muted">{form.address || '—'} · {form.email || '—'}</p>
      <p className="muted">NAAC {form.accreditation.naac || '—'} · NBA: {form.accreditation.nba.join(', ') || '—'}</p>
      <p className="muted">Email {form.emailVerified ? '✓ verified' : '· not verified'} · AISHE {form.aisheVerified ? '✓ verified' : '· not verified'}</p>
    </>
  )
}

// ---------------- industry ----------------
function IndustryStep({ step, form, set }) {
  const toast = useStoreToast()
  const [checking, setChecking] = useState(false)
  const cinOk = /^[A-Z]\d{6}[A-Z]{2}\d{4}[A-Z]{3}\d{5}$/i.test(form.cin || '')

  if (step === 0) return (
    <>
      <h2 style={{ marginBottom: 14 }}>Company details</h2>
      <Field label="Company name"><TextInput value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. TechNova Solutions" /></Field>
      <div className="grid cols-2">
        <Field label="Email"><TextInput type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="careers@company.in" /></Field>
        <Field label="Contact number"><TextInput value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
      </div>
      <Field label="Account Password"><TextInput type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Set password for company login" /></Field>
      <Field label="Registered address"><TextInput value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
    </>
  )
  if (step === 1) return (
    <>
      <h2 style={{ marginBottom: 14 }}>Verification & profile</h2>
      <div className="card" style={{ background: 'var(--paper)', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <b>CIN (Corporate Identification Number)</b>
            <Field label="CIN" hint="21-character CIN, verified against MCA records (simulated).">
              <TextInput value={form.cin} onChange={(e) => { set('cin', e.target.value.toUpperCase()); set('cinVerified', false) }} placeholder="U72900KA2015PTC091234" />
            </Field>
          </div>
          {form.cinVerified
            ? <span className="badge green" style={{ marginTop: 26 }}><Icon name="check" size={12} /> Company verified</span>
            : <button className="btn btn-primary btn-sm" style={{ marginTop: 26 }} disabled={!cinOk || checking} onClick={() => { setChecking(true); setTimeout(() => { set('cinVerified', true); setChecking(false); toast('CIN verified — company registered.') }, 900) }}>{checking ? 'Checking…' : 'Verify CIN'}</button>}
        </div>
      </div>
      <Field label="Company description" hint="Students and our matcher use this to find relevant candidates.">
        <TextArea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What does your company build, and what kind of talent do you look for?" />
      </Field>
      <Field label="Hiring focus areas">
        <SkillChips
          selected={form.tags} all={INTEREST_AREAS}
          onToggle={(s) => set('tags', form.tags.includes(s) ? form.tags.filter((x) => x !== s) : [...form.tags, s])}
        />
      </Field>
    </>
  )
  return (
    <>
      <h2 style={{ marginBottom: 14 }}>Review</h2>
      <p><b>{form.name || '—'}</b> · CIN {form.cin || '—'} {form.cinVerified ? '✓' : ''}</p>
      <p className="muted">{form.address || '—'} · {form.email || '—'}</p>
      <p className="small">{form.description || 'No description yet.'}</p>
      <p className="muted">Hiring focus: {form.tags.join(', ') || '—'}</p>
    </>
  )
}

function useStoreToast() { return useToast() }
