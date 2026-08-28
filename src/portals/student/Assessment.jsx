import { useMemo, useState, useEffect, useRef } from 'react'
import { useStore, profileOf } from '../../lib/store'
import { useI18n } from '../../lib/i18n'
import { getDynamicQuestionPool } from '../../lib/seed'
import { createProctorMonitor } from '../../lib/proctor'
import { Icon, ProgressBar, Badge, Modal, useToast } from '../../components/ui'
import { skillLevel, LEVEL_TONE, todayISO } from '../../lib/util'

export function Assessment() {
  const { db, session, submitAssessment, notify } = useStore()
  const { t } = useI18n()
  const toast = useToast()
  const id = session.userId
  const profile = profileOf(db, id)
  const existing = db?.assessments?.[id]

  const [phase, setPhase] = useState(existing ? 'done' : 'intro')
  const [answers, setAnswers] = useState({})
  const [idx, setIdx] = useState(0)
  const [activePool, setActivePool] = useState(null)

  // Security & Proctoring State
  const [integrityScore, setIntegrityScore] = useState(100)
  const [riskLevel, setRiskLevel] = useState('Low Risk')
  const [proctorLogs, setProctorLogs] = useState([])
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [hasAgreedConsent, setHasAgreedConsent] = useState(false)
  const monitorRef = useRef(null)

  const handleStartRequest = () => {
    setHasAgreedConsent(false)
    setShowConsentModal(true)
  }

  const handleConsentApproved = () => {
    setShowConsentModal(false)

    // Request Fullscreen mode
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
      }
    } catch (e) {
      console.warn('Fullscreen request bypassed:', e)
    }

    const previousSeen = existing?.seenHashes || []
    const pool = getDynamicQuestionPool(profile.skills || [], previousSeen, 10)
    setActivePool(pool)
    setAnswers({})
    setIdx(0)
    setIntegrityScore(100)
    setRiskLevel('Low Risk')
    setProctorLogs([])

    // Start Proctor Monitor after explicit user consent
    monitorRef.current = createProctorMonitor(id, (update) => {
      setIntegrityScore(update.integrityScore)
      setRiskLevel(update.riskLevel)
      setProctorLogs(update.logs)
      toast(`⚠️ ${t('securityWarningText', 'Security Warning')}: ${update.details}`)
    })
    monitorRef.current.start()

    setPhase('quiz')
  }

  const finish = () => {
    if (monitorRef.current) {
      monitorRef.current.stop()
    }

    // Exit Fullscreen
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen()
      }
    } catch (e) {
      console.warn('Exit fullscreen bypass:', e)
    }

    if (!activePool) return
    const { questions, newSeenHashes } = activePool
    const bySkill = {}

    for (const q of questions) {
      bySkill[q.skill] = bySkill[q.skill] || { total: 0, correct: 0 }
      bySkill[q.skill].total += 1
      if (answers[questions.indexOf(q)] === q.a) bySkill[q.skill].correct += 1
    }

    const scores = {}
    let sum = 0
    for (const [skill, s] of Object.entries(bySkill)) {
      const score = Math.round((100 * s.correct) / s.total)
      scores[skill] = { score, level: skillLevel(score) }
      sum += score
    }

    const overall = Math.round(sum / (Object.keys(bySkill).length || 1))
    const result = {
      takenAt: todayISO(),
      overall,
      scores,
      integrityScore,
      riskLevel,
      proctorViolationsCount: proctorLogs.length,
      seenHashes: newSeenHashes
    }

    submitAssessment(id, result)
    notify(id, `Assessment complete — overall score ${overall}/100 (Integrity: ${integrityScore}%). Skills live on profile.`)
    toast('Assessment submitted — skills & proctor audit recorded!')
    setPhase('done')
  }

  if (phase === 'intro') return (
    <div style={{ maxWidth: 680 }}>
      <div className="card">
        <h2 style={{ marginBottom: 8 }}>{t('assessment', 'Dynamic Skill Assessment')}</h2>
        <p className="muted">
          A dynamic, non-repeating adaptive test tailored to your education, degree, and claimed skills.
        </p>
        <ul className="muted" style={{ lineHeight: 2 }}>
          <li><b>Zero Repeated Questions</b> — Fresh randomized question pools on every attempt</li>
          <li><b>Dynamic Option Shuffling</b> — Prevents memorization and tests true comprehension</li>
          <li><b>Verified Skill Badge</b> — Publicly showcases verified skill levels to recruiters</li>
          <li><b>Proctored Environment</b> — Tab switching & DevTools detection enabled</li>
        </ul>
        {profile.skills?.length ? (
          <div style={{ margin: '12px 0' }}>
            <span className="small muted">Covering your target skills:</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {profile.skills.map((s) => <Badge key={s} tone="sky">{s}</Badge>)}
            </div>
          </div>
        ) : (
          <div className="notice info" style={{ margin: '12px 0' }}>You haven’t claimed any skills in your profile — starting with general technical & soft skill aptitude.</div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn btn-accent btn-lg" onClick={handleStartRequest}>
            {t('startAssessment', 'Start Dynamic Assessment')} (10 Questions) <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>

      {/* Pre-Assessment Consent & Security Rules Modal */}
      {showConsentModal && (
        <Modal title={t('consentTitle', 'Assessment Rules, Regulations & Privacy Notice')} onClose={() => setShowConsentModal(false)}>
          <div style={{ padding: 4 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(232, 147, 12, 0.1)', border: '1px solid var(--marigold)', marginBottom: 16 }}>
              <b style={{ color: 'var(--marigold-ink)', fontSize: 14 }}>🛡️ Secure Proctored Examination Protocol</b>
              <p className="small" style={{ margin: '4px 0 0', lineHeight: 1.5 }}>
                Please review the security monitoring policies below before starting your assessment.
              </p>
            </div>

            <h4 style={{ marginBottom: 8, fontSize: 14 }}>📌 Monitoring & Examination Rules:</h4>
            <ul style={{ margin: '0 0 16px 20px', padding: 0, fontSize: 13, lineHeight: 1.8, color: 'var(--ink-700)' }}>
              <li><b>Fullscreen Mode:</b> {t('rulesFullscreen')}</li>
              <li><b>Tab Switching & Window Focus:</b> {t('rulesTabSwitch')}</li>
              <li><b>DevTools & Keyboard Shortcuts:</b> {t('rulesDevTools')}</li>
              <li><b>Screen-Sharing Signals:</b> {t('rulesScreenSharing')}</li>
              <li><b>SHA-256 Audit Trail:</b> Security violations are digitally signed and recorded in tamper-evident logs.</li>
            </ul>

            <div style={{ padding: 12, borderRadius: 6, background: 'var(--bg-2)', border: '1px solid var(--line-2)', marginBottom: 16 }}>
              <b className="small" style={{ color: 'var(--bad)' }}>⚠️ Important Security Disclaimer:</b>
              <div className="small muted" style={{ marginTop: 4, lineHeight: 1.5 }}>
                {t('disclaimerText', 'Notice: Browser-based monitoring cannot guarantee 100% detection of screen mirroring or external physical hardware devices.')}
              </div>
            </div>

            {/* Checkbox Acknowledgment */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', margin: '14px 0', fontSize: 13, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={hasAgreedConsent}
                onChange={(e) => setHasAgreedConsent(e.target.checked)}
                style={{ marginTop: 3, width: 16, height: 16, cursor: 'pointer' }}
              />
              <span>{t('agreeCheckbox', 'I have read, understood, and agree to the Rules, Proctoring Terms & Privacy Notice')}</span>
            </label>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-ghost" type="button" onClick={() => setShowConsentModal(false)}>Cancel</button>
              <button
                className="btn btn-accent btn-lg"
                type="button"
                disabled={!hasAgreedConsent}
                onClick={handleConsentApproved}
              >
                ✓ {t('startTestBtn', 'I Agree & Start Test')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )

  if (phase === 'quiz' && activePool) {
    const { questions } = activePool
    const q = questions[idx]
    return (
      <div style={{ maxWidth: 640 }}>
        {/* Security Proctoring Status Header */}
        <div className="card" style={{ marginBottom: 12, padding: '10px 16px', borderLeft: '4px solid var(--good)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="shield" size={16} />
              <span className="small"><b>Proctoring Active</b> (Tab, Focus & DevTools Monitor)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="small muted">Integrity:</span>
              <Badge tone={integrityScore >= 85 ? 'green' : integrityScore >= 65 ? 'gold' : 'rust'} style={{ fontWeight: 700 }}>
                {integrityScore}% ({riskLevel})
              </Badge>
            </div>
          </div>
          <div className="small muted" style={{ fontSize: 11.5, marginTop: 4 }}>
            🛡️ Browser Security Notice: Monitors tab focus, fullscreen state & DevTools. SHA-256 tamper-evident logs recorded.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }} className="small muted">
          <span>Question {idx + 1} of {questions.length} (Dynamic Non-Repeating)</span>
          <Badge tone="sky">{q.skill}</Badge>
        </div>
        <ProgressBar value={(100 * idx) / questions.length} />
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 16 }}>{q.q}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.opts.map((opt, oi) => (
              <button
                key={oi}
                className="role-card" style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}
                onClick={() => setAnswers({ ...answers, [idx]: oi })}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', border: `2px solid ${answers[idx] === oi ? 'var(--marigold)' : 'var(--line-2)'}`,
                  background: answers[idx] === oi ? 'var(--marigold)' : 'transparent', flex: 'none',
                }} />
                <span style={{ fontSize: 14 }}>{opt}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
            <button className="btn btn-ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Previous</button>
            {idx < questions.length - 1
              ? <button className="btn btn-primary" disabled={answers[idx] == null} onClick={() => setIdx(idx + 1)}>Next →</button>
              : <button className="btn btn-accent" disabled={Object.keys(answers).length < questions.length} onClick={finish}>Submit assessment</button>}
          </div>
        </div>
      </div>
    )
  }

  const result = db.assessments[id]
  return (
    <div style={{ maxWidth: 720 }}>
      <div className="card" style={{ textAlign: 'center', marginBottom: 18 }}>
        <div className="badge green" style={{ marginBottom: 10 }}><Icon name="check" size={12} /> Assessment complete</div>
        <h2>Overall score: {result.overall}/100</h2>
        <p className="muted">Your verified skills are now part of your profile and resume.</p>
        <div style={{ marginTop: 14 }}>
          <button className="btn btn-outline btn-sm" onClick={prepareQuiz}>
            <Icon name="refresh" size={14} /> Retake Assessment (Fresh Non-Repeating Questions)
          </button>
        </div>
      </div>

      <div className="grid cols-2">
        {Object.entries(result.scores || {}).map(([skill, s]) => (
          <div key={skill} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <b>{skill}</b>
              <ProgressBar value={s.score} />
            </div>
            <div style={{ textAlign: 'right', marginLeft: 16 }}>
              <div className="mono" style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>{s.score}</div>
              <Badge tone={LEVEL_TONE[s.level]}>{s.level}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

