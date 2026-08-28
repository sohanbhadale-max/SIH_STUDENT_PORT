import { useStore, profileOf } from '../lib/store'
import { Avatar, Icon, useToast } from './ui'
import { timeAgo } from '../lib/util'

export function AnnouncementsView({ filterInstitute }) {
  const { db, session, deleteAnnouncement } = useStore()
  const toast = useToast()
  const currentUser = db.users[session?.userId]
  const userProfile = profileOf(db, session?.userId)
  const userInst = userProfile.institute || (currentUser?.role === 'institute' ? (userProfile.name || currentUser?.name) : '')

  const targetInst = filterInstitute || userInst

  const list = db.announcements.filter((a) => {
    if (!targetInst) return true
    return !a.institute || a.institute === targetInst
  })

  return (
    <div style={{ maxWidth: 760 }}>
      {list.length === 0 && <p className="muted">No announcements found for this institute.</p>}
      {list.map((a) => {
        const faculty = db.users[a.facultyId]
        const isAuthorOrAdmin = a.facultyId === session?.userId || currentUser?.role === 'institute'

        return (
          <div key={a.id} className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <Avatar name={faculty?.name || 'Faculty'} />
              <div style={{ flex: 1 }}>
                <b>{faculty?.name || 'Faculty / Institute'}</b>
                <div className="small muted">
                  {timeAgo(a.createdAt)} · to {a.audience} {a.institute ? `· ${a.institute}` : ''}
                </div>
              </div>
              {isAuthorOrAdmin && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--bad)' }}
                  title="Delete announcement"
                  onClick={() => {
                    deleteAnnouncement(a.id)
                    toast?.('Announcement deleted')
                  }}
                >
                  <Icon name="trash" size={14} /> Delete
                </button>
              )}
            </div>
            <h3 style={{ marginBottom: 6 }}>{a.title}</h3>
            <p style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{a.body}</p>
          </div>
        )
      })}
    </div>
  )
}
