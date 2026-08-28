import { useMemo, useState } from 'react'
import { useStore, profileOf } from '../../lib/store'
import { shuffledQuestion } from '../../lib/seed'
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

  const questions = useMemo(() => {
    const pool = []
    const claimed = profile.skills?.length ? profile.skills : ['Problem Solving']
    for (const skill of claimed) {
      let qi = 0
      while (pool.length < 12) {
        const q = shuffledQuestion(skill, qi)
        if (!q) break
        pool.push({ skill, ...q })
        qi += 1
        if (qi > 2) break
      }
    }
    if (!pool.some((q) => q.skill === 'Problem Solving')) {
      const q = shuffledQuestion('Problem Solving', 0)
      if (q) pool.push({ skill: 'Problem Solving', ...q })
    }
    return pool.slice(0, 10)
  }, [profile.skills])

  const start = () => { setPhase('quiz'); setIdx(0); setAnswers({}) }

  const finish = () => {
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
    const overall = Math.round(sum / Object.keys(bySkill).length)
    const result = { takenAt: todayISO(), overall, scores }
    submitAssessment(id, result)
    notify(id, `Assessment complete — overall score ${overall}/100. Your verified skills are now live on your profile.`)
    toast('Assessment submitted — skills added to your profile!')
    setPhase('done')
  }

  if (phase === 'intro') return (
    <div style={{ maxWidth: 640 }}>
      <div className="card">
        <h2 style={{ marginBottom: 8 }}>Skill assessment</h2>
        <p className="muted">
          A short test based on your education, interests and claimed skills. It unlocks:
        </p>
        <ul className="muted" style={{ lineHeight: 2 }}>
          <li>Your skills shown publicly with a <b>skill level score</b></li>
          <li>Verified internship matching (eligibility notifications)</li>
          <li>A real employability score on your profile and resume</li>
        </ul>
        {profile.skills?.length
          ? <p className="small">Covering your claimed skills: {profile.skills.join(', ')}</p>
          : <div className="notice info" style={{ margin: '12px 0' }}>You haven’t claimed any skills in your profile — we’ll start with a general aptitude round.</div>}
        <div className="notice" style={{ margin: '12px 0' }}>
          <Icon name="clock" size={18} />
          <div>You can skip this for now — we’ll keep reminding you until your profile is complete.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-accent btn-lg" onClick={start} disabled={questions.length === 0}>
            Start assessment ({questions.length} questions) <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  if (phase === 'quiz') {
    const q = questions[idx]
    return (
      <div style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }} className="small muted">
          <span>Question {idx + 1} of {questions.length}</span>
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
                {opt}
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
      </div>
      <div className="grid cols-2">
        {Object.entries(result.scores).map(([skill, s]) => (
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
      <p className="small muted" style={{ marginTop: 16 }}>
        Tip: retake later from your profile page if you upskill through courses.
      </p>
    </div>
  )
}
