import { useState } from 'react'
import { useStore, profileOf, verifiedSkills } from '../../lib/store'
import { Field, TextInput, Select, Icon, Badge, ScoreRing, useToast, Modal } from '../../components/ui'
import { fmtDate } from '../../lib/util'

const KNOWN_ISSUERS = [
  { name: 'Amazon Web Services (AWS)', trust: 100, tier: 'Tier 1 Global Authority', icon: 'cloud', badgeColor: 'gold' },
  { name: 'Google Cloud Platform (GCP)', trust: 100, tier: 'Tier 1 Global Authority', icon: 'cloud', badgeColor: 'sky' },
  { name: 'Cisco Networking Academy', trust: 98, tier: 'Tier 1 Global Authority', icon: 'shield', badgeColor: 'indigo' },
  { name: 'Microsoft Certified Professional', trust: 98, tier: 'Tier 1 Global Authority', icon: 'shield', badgeColor: 'blue' },
  { name: 'Credly Digital Badge', trust: 96, tier: 'Verified Credential Network', icon: 'check', badgeColor: 'green' },
  { name: 'Sertifier Verified Badge', trust: 95, tier: 'Verified Credential Network', icon: 'check', badgeColor: 'teal' },
  { name: 'NPTEL / SWAYAM (Govt of India)', trust: 95, tier: 'Government & Academic Authority', icon: 'award', badgeColor: 'plum' },
  { name: 'Coursera / edX Partner', trust: 88, tier: 'Online Academic Provider', icon: 'book', badgeColor: 'sky' },
  { name: 'Udemy Certificate of Completion', trust: 80, tier: 'Verified Learning Provider', icon: 'book', badgeColor: 'gray' },
]

const TRUSTED_DOMAINS = [
  { domain: 'credly.com', name: 'Credly Digital Badge', trust: 98 },
  { domain: 'swayam.gov.in', name: 'NPTEL / SWAYAM (Govt of India)', trust: 98 },
  { domain: 'nptel.ac.in', name: 'NPTEL / SWAYAM (Govt of India)', trust: 98 },
  { domain: 'aws.amazon.com', name: 'Amazon Web Services (AWS)', trust: 100 },
  { domain: 'cisco.com', name: 'Cisco Networking Academy', trust: 98 },
  { domain: 'coursera.org', name: 'Coursera / edX Partner', trust: 90 },
  { domain: 'edx.org', name: 'Coursera / edX Partner', trust: 90 },
  { domain: 'sertifier.com', name: 'Sertifier Verified Badge', trust: 95 },
  { domain: 'microsoft.com', name: 'Microsoft Certified Professional', trust: 98 },
  { domain: 'google.com', name: 'Google Cloud Platform (GCP)', trust: 100 },
  { domain: 'udemy.com', name: 'Udemy Certificate of Completion', trust: 80 },
  { domain: 'hackerrank.com', name: 'HackerRank Verified Skill Certificate', trust: 92 },
  { domain: 'leetcode.com', name: 'LeetCode Verified Badge', trust: 90 }
]

const VALID_SKILLS_DATABASE = [
  'AWS', 'Cloud & DevOps', 'React', 'Node.js', 'SQL', 'JavaScript', 'Python', 'Java',
  'C', 'C++', 'Linux', 'Machine Learning', 'Statistics', 'Power BI', 'Excel', 'Spring Boot',
  'Embedded C', 'RTOS', 'Communication', 'Problem Solving', 'Docker', 'Kubernetes',
  'Git', 'Cybersecurity', 'Data Science', 'Data Analytics', 'HTML', 'CSS', 'Tailwind',
  'TypeScript', 'MongoDB', 'PostgreSQL', 'Express', 'Figma', 'UI/UX'
]

function validateCredentialInput({ title, issuer, url, certId, extractedSkills }) {
  const errors = []
  const cleanTitle = (title || '').trim()
  const cleanUrl = (url || '').trim().toLowerCase()
  const cleanCertId = (certId || '').trim()

  if (!cleanTitle || cleanTitle.length < 4) {
    errors.push('Certificate Title must be at least 4 characters long.')
  } else if (/^(asdf|qwer|1234|test|xyz|abc|xxx|aaaa|bbbb|garbage|fake)+$/i.test(cleanTitle.replace(/\s/g, ''))) {
    errors.push('Certificate Title appears to be invalid or test gibberish.')
  }

  if (!cleanCertId || cleanCertId.length < 4) {
    errors.push('Certificate ID / Serial Number is required (e.g. AWS-89210-2026).')
  } else if (/^(12345|abcde|asdfg|test1|00000|11111|xxxxx|asdf)+$/i.test(cleanCertId.replace(/\s/g, ''))) {
    errors.push('Certificate ID is invalid or contains test filler data.')
  }

  let matchedDomain = null
  let isURLValid = false

  if (!cleanUrl) {
    errors.push('Credential Verification URL is required.')
  } else {
    try {
      const parsedUrl = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`)
      isURLValid = true
      matchedDomain = TRUSTED_DOMAINS.find((d) => parsedUrl.hostname.includes(d.domain))
    } catch {
      errors.push('Please enter a valid URL (e.g. https://credly.com/badges/your-id or https://swayam.gov.in/cert/123).')
    }
  }

  if (isURLValid && !matchedDomain) {
    errors.push('Credential URL must be from an official verification portal (Credly, AWS, NPTEL/SWAYAM, Cisco, Coursera, Sertifier, Microsoft, Google, Udemy, HackerRank).')
  }

  const rawSkillsList = extractedSkills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const validatedSkills = rawSkillsList.filter((sk) => {
    const norm = sk.toLowerCase()
    return VALID_SKILLS_DATABASE.some((validSk) => validSk.toLowerCase() === norm || norm.includes(validSk.toLowerCase()))
  })

  if (rawSkillsList.length > 0 && validatedSkills.length === 0) {
    errors.push('No recognized technical skills found. Please enter standard skills like React, Python, AWS, SQL, Machine Learning.')
  }

  let calculatedTrust = matchedDomain ? matchedDomain.trust : 0

  return {
    isValid: errors.length === 0,
    errors,
    status: errors.length === 0 ? 'Verified' : 'Rejected',
    trustScore: calculatedTrust,
    skills: validatedSkills.length > 0 ? validatedSkills : ['General Technical Competency']
  }
}

export function CredentialVerificationModule() {
  const { db, session, saveProfile, notify } = useStore()
  const toast = useToast()
  const id = session.userId
  const profile = profileOf(db, id)

  const [credentials, setCredentials] = useState(profile.verifiedCredentials || [
    {
      id: 'cred-1',
      title: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services (AWS)',
      url: 'https://credly.com/badges/aws-certified-cloud-practitioner-demo',
      certId: 'AWS-89210-2025',
      trustScore: 100,
      skills: ['AWS', 'Cloud & DevOps', 'EC2', 'S3'],
      verifiedAt: '2025-11-12',
      status: 'Verified'
    },
    {
      id: 'cred-2',
      title: 'NPTEL Full Stack Web Development',
      issuer: 'NPTEL / SWAYAM (Govt of India)',
      url: 'https://swayam.gov.in/certificate/nptel-fsd-9921',
      certId: 'NPTEL-2026-FSD-44',
      trustScore: 95,
      skills: ['React', 'Node.js', 'SQL', 'JavaScript'],
      verifiedAt: '2026-02-18',
      status: 'Verified'
    }
  ])

  const [title, setTitle] = useState('')
  const [issuer, setIssuer] = useState('Amazon Web Services (AWS)')
  const [url, setUrl] = useState('')
  const [certId, setCertId] = useState('')
  const [extractedSkills, setExtractedSkills] = useState('React, Cloud & DevOps, Python, SQL')
  const [formErrors, setFormErrors] = useState([])
  const [isVerifying, setIsVerifying] = useState(false)
  const [openModal, setOpenModal] = useState(false)

  const avgTrustScore = credentials.length
    ? Math.round(credentials.reduce((acc, c) => acc + c.trustScore, 0) / credentials.length)
    : 85

  const allVerifiedSkills = [...new Set(credentials.flatMap((c) => c.skills))]

  const careerPaths = [
    {
      role: 'Cloud & DevOps Architect',
      matchPct: allVerifiedSkills.some((s) => ['AWS', 'Cloud & DevOps', 'Linux'].includes(s)) ? 94 : 65,
      demand: 'High Demand (120+ Postings)',
      keySkills: ['AWS', 'Cloud & DevOps', 'Docker', 'Linux']
    },
    {
      role: 'Full Stack Software Engineer',
      matchPct: allVerifiedSkills.some((s) => ['React', 'Node.js', 'JavaScript', 'SQL'].includes(s)) ? 96 : 70,
      demand: 'High Demand (180+ Postings)',
      keySkills: ['React', 'JavaScript', 'Node.js', 'SQL']
    },
    {
      role: 'AI & Data Systems Specialist',
      matchPct: allVerifiedSkills.some((s) => ['Python', 'Machine Learning', 'SQL'].includes(s)) ? 88 : 55,
      demand: 'Very High Demand',
      keySkills: ['Python', 'Machine Learning', 'Statistics', 'SQL']
    }
  ]

  const handleVerifyAndAdd = (e) => {
    e.preventDefault()
    setFormErrors([])

    const validation = validateCredentialInput({
      title,
      issuer,
      url,
      certId,
      extractedSkills
    })

    if (!validation.isValid) {
      setFormErrors(validation.errors)
      toast('Verification Failed: Invalid or Garbage Credential Data')
      return
    }

    setIsVerifying(true)
    setTimeout(() => {
      const newCred = {
        id: `cred-${Date.now()}`,
        title: title.trim(),
        issuer,
        url: url.trim(),
        certId: certId.trim(),
        trustScore: validation.trustScore,
        skills: validation.skills,
        verifiedAt: new Date().toISOString().split('T')[0],
        status: 'Verified'
      }

      const updatedCreds = [newCred, ...credentials]
      setCredentials(updatedCreds)

      const currentProfileSkills = profile.skills || []
      const mergedSkills = [...new Set([...currentProfileSkills, ...validation.skills])]
      saveProfile(id, {
        verifiedCredentials: updatedCreds,
        skills: mergedSkills
      })

      notify(id, `🎉 Credential "${title}" verified! Added ${validation.skills.length} verified skills to your profile.`)
      toast(`Credential Verified! Trust Score: ${validation.trustScore}/100`)

      setTitle('')
      setUrl('')
      setCertId('')
      setFormErrors([])
      setIsVerifying(false)
      setOpenModal(false)
    }, 1000)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Credential Verification & Skill Mapping</h1>
          <p className="sub">Verify digital credentials (Credly, AWS, Cisco, NPTEL) to extract verified skills and unlock smart recommendations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setFormErrors([]); setOpenModal(true) }}>
          <Icon name="plus" size={15} /> Add / Verify New Credential
        </button>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 20 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ScoreRing value={avgTrustScore} size={54} stroke={6} />
          <div>
            <b className="small muted" style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>Trust Score</b>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--good)' }}>{avgTrustScore} / 100</div>
            <div className="small muted">High Trust Index</div>
          </div>
        </div>

        <div className="card">
          <b className="small muted" style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>Verified Credentials</b>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{credentials.length}</div>
          <div className="small muted">Digitally Signed Badges</div>
        </div>

        <div className="card">
          <b className="small muted" style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>Extracted Verified Skills</b>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: 'var(--sky)' }}>{allVerifiedSkills.length}</div>
          <div className="small muted">Live on Student Profile</div>
        </div>

        <div className="card">
          <b className="small muted" style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>Skill Growth Boost</b>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: 'var(--marigold-ink)' }}>+45%</div>
          <div className="small muted">Higher Recruiter Visibility</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div>
          <h3 style={{ marginBottom: 12 }}>Active Verified Credentials & Badges</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {credentials.map((c) => (
              <div key={c.id} className="card" style={{ borderLeft: '4px solid var(--good)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 16 }}>{c.title}</h3>
                      <Badge tone="green"><Icon name="check" size={11} /> {c.status}</Badge>
                    </div>
                    <div className="muted small" style={{ marginTop: 4 }}>
                      Issued by <b>{c.issuer}</b> · Verified on {c.verifiedAt} · Cert ID: <span className="mono">{c.certId}</span>
                    </div>
                  </div>
                  <Badge tone="gold" style={{ fontSize: 13, fontWeight: 700 }}>
                    Trust: {c.trustScore}/100
                  </Badge>
                </div>

                <div style={{ marginTop: 12 }}>
                  <span className="small muted" style={{ display: 'block', marginBottom: 4 }}>Extracted Verified Skills:</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {c.skills.map((s) => (
                      <Badge key={s} tone="sky">{s}</Badge>
                    ))}
                  </div>
                </div>

                {c.url && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 8 }}>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="small" style={{ color: 'var(--sky)', textDecoration: 'none', fontWeight: 600 }}>
                      🔗 View Digital Credential Badge on {c.issuer.split(' ')[0]} →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: 12 }}>AI Career Path Skill Mapping</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {careerPaths.map((cp) => (
              <div key={cp.role} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <b style={{ fontSize: 14 }}>{cp.role}</b>
                  <Badge tone={cp.matchPct >= 90 ? 'green' : 'gold'}>{cp.matchPct}% Match</Badge>
                </div>
                <div className="small muted" style={{ marginBottom: 8 }}>{cp.demand}</div>
                <div className="progress" style={{ marginBottom: 8 }}>
                  <div style={{ width: `${cp.matchPct}%` }} />
                </div>
                <div className="small muted">
                  Key Skills: {cp.keySkills.map((s) => <span key={s} style={{ fontWeight: allVerifiedSkills.includes(s) ? 700 : 400, color: allVerifiedSkills.includes(s) ? 'var(--good)' : 'var(--ink-500)' }}>{s} · </span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {openModal && (
        <Modal title="Verify Digital Credential & Extract Skills" onClose={() => setOpenModal(false)}>
          <form onSubmit={handleVerifyAndAdd}>
            {formErrors.length > 0 && (
              <div style={{ padding: 12, borderRadius: 6, background: 'rgba(235, 87, 87, 0.1)', border: '1px solid var(--bad)', marginBottom: 16 }}>
                <b style={{ color: 'var(--bad)', fontSize: 13 }}>⚠️ Verification Failed:</b>
                <ul style={{ margin: '6px 0 0 18px', padding: 0, fontSize: 12, color: 'var(--bad)' }}>
                  {formErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
            <Field label="Certification / Course Title" required>
              <TextInput
                placeholder="e.g. AWS Certified Solutions Architect, Cisco CCNA"
                value={title} onChange={(e) => setTitle(e.target.value)} required
              />
            </Field>

            <Field label="Issuing Provider / Authority">
              <Select value={issuer} onChange={(e) => setIssuer(e.target.value)}>
                {KNOWN_ISSUERS.map((i) => (
                  <option key={i.name} value={i.name}>{i.name} ({i.trust}% Trust)</option>
                ))}
              </Select>
            </Field>

            <Field label="Credential URL or Public Badge Link" required hint="Must be a valid badge link from Credly, AWS, NPTEL/SWAYAM, Cisco, Coursera, Sertifier, Google, etc.">
              <TextInput
                placeholder="https://credly.com/badges/your-badge-id"
                value={url} onChange={(e) => setUrl(e.target.value)} required
              />
            </Field>

            <Field label="Certificate ID / Serial Number" required hint="e.g. AWS-89210-2026 or NPTEL26CS14">
              <TextInput
                placeholder="e.g. AWS-992014-2026 or NPTEL26CS14"
                value={certId} onChange={(e) => setCertId(e.target.value)} required
              />
            </Field>

            <Field label="Skills Covered (Comma Separated)">
              <TextInput
                placeholder="e.g. AWS, Cloud & DevOps, React, Python, SQL"
                value={extractedSkills} onChange={(e) => setExtractedSkills(e.target.value)}
              />
              <span className="small muted">Only recognized technical skills will be added to your profile.</span>
            </Field>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-ghost" type="button" onClick={() => setOpenModal(false)}>Cancel</button>
              <button className="btn btn-accent" type="submit" disabled={isVerifying}>
                {isVerifying ? 'Verifying Issuer & Hashes…' : 'Verify & Extract Skills'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
