import { useMemo, useState } from 'react'
import { useStore, profileOf } from '../../lib/store'
import { getDynamicQuestionPool } from '../../lib/seed'
import { Icon, ProgressBar, Badge, useToast } from '../../components/ui'
import { skillLevel, LEVEL_TONE, todayISO } from '../../lib/util'

export function Assessment() {
  const { db, session, submitAssessment, notify } = useStore()
  const toast = useToast()
  const id = session.userId
  const profile = profileOf(db, id)
  const existing = db.assessments[id]

  const [phase, setPhase] = useState(existing ? 'done' : 'intro')
  const [answers, setAnswers] = useState({})
  const [idx, setIdx] = useState(0)
  const [activePool, setActivePool] = useState(null)

  const prepareQuiz = () => {
    const previousSeen = existing?.seenHashes || []
    const pool = getDynamicQuestionPool(profile.skills || [], previousSeen, 10)
    setActivePool(pool)
    setAnswers({})
    setIdx(0)
    setPhase('quiz')
  }

  const finish = () => {
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
      seenHashes: newSeenHashes
    }

    submitAssessment(id, result)
    notify(id, `Assessment complete — overall score ${overall}/100. Your verified skills are now live on your profile.`)
    toast('Assessment submitted — skills added to your profile!')
    setPhase('done')
  }

  if (phase === 'intro') return (
    <div style={{ maxWidth: 640 }}>
      <div className="card">
        <h2 style={{ marginBottom: 8 }}>Dynamic Skill Assessment</h2>
        <p className="muted">
          A dynamic, non-repeating adaptive test tailored to your education, degree, and claimed skills.
        </p>
        <ul className="muted" style={{ lineHeight: 2 }}>
          <li><b>Zero Repeated Questions</b> — Fresh randomized question pools on every attempt</li>
          <li><b>Dynamic Option Shuffling</b> — Prevents memorization and tests true comprehension</li>
          <li><b>Verified Skill Badge</b> — Publicly showcases verified skill levels to recruiters</li>
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
          <button className="btn btn-accent btn-lg" onClick={prepareQuiz}>
            Start Dynamic Assessment (10 Questions) <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  if (phase === 'quiz' && activePool) {
    const { questions } = activePool
    const q = questions[idx]
    return (
      <div style={{ maxWidth: 640 }}>
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

