import { useStore, profileOf, recommendedCourses } from '../../lib/store'
import { Badge, Icon, useToast, Empty } from '../../components/ui'
import { fmtDate } from '../../lib/util'

export function Learn() {
  const { db, session, enroll, completeCourse, notify } = useStore()
  const toast = useToast()
  const id = session.userId
  const profile = profileOf(db, id)
  const recs = recommendedCourses(db, id)
  const myEnrollments = db.enrollments.filter((e) => e.userId === id)
  const certRows = myEnrollments.filter((e) => e.status === 'completed')

  const onEnroll = (course) => {
    enroll(id, course.id)
    toast(`Enrolled in “${course.title}”.`)
  }
  const onComplete = (course) => {
    completeCourse(id, course.id)
    notify(id, `Certificate earned: ${course.title}. Added to your profile and resume.`)
    toast(`Course complete — certificate issued for ${course.skill}.`)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Upskill</h1>
          <p className="sub">Courses matched to your interests{profile.jobInterest ? ` and your goal of becoming a ${profile.jobInterest}` : ''}.</p>
        </div>
      </div>

      {certRows.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Your certificates</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {certRows.map((e) => {
              const c = db.courses.find((x) => x.id === e.courseId)
              return (
                <div key={e.id} className="badge green" style={{ padding: '8px 14px', fontSize: 12.5 }}>
                  <Icon name="cert" size={14} />
                  {c?.title} · {e.certificate.id} · {fmtDate(e.certificate.issuedAt)}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {recs.length === 0
        ? <Empty icon="book" title="You’re enrolled in everything we recommend" sub="Complete your courses to earn certificates." />
        : (
          <div className="grid cols-3">
            {recs.map(({ course, score }) => {
              const enr = myEnrollments.find((e) => e.courseId === course.id)
              return (
                <div key={course.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Badge tone="gold">{course.level}</Badge>
                    {score >= 2 && <Badge tone="green"><Icon name="spark" size={11} /> Recommended</Badge>}
                  </div>
                  <h3 style={{ fontSize: 15.5 }}>{course.title}</h3>
                  <p className="small muted" style={{ marginBottom: 0 }}>
                    {course.provider} · {course.duration} · builds <b>{course.skill}</b>
                  </p>
                  <div style={{ marginTop: 'auto' }}>
                    {!enr
                      ? <button className="btn btn-primary btn-sm" onClick={() => onEnroll(course)}>Enroll</button>
                      : <button className="btn btn-good btn-sm" onClick={() => onComplete(course)}>
                          <Icon name="check" size={13} /> Mark completed & get certificate
                        </button>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </>
  )
}
