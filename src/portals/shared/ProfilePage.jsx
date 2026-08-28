import { useStore, profileOf } from '../../lib/store'
import { ProfileWizard } from '../../screens/ProfileWizard'
import { useToast } from '../../components/ui'

export function ProfilePage({ role }) {
  const { db, session, saveProfile } = useStore()
  const toast = useToast()
  const profile = profileOf(db, session.userId)
  const user = db.users[session.userId]
  return (
    <div style={{ margin: '-26px -30px' }}>
      <ProfileWizard
        role={role}
        compact
        initial={{ ...profile, name: user?.name, email: user?.email, phone: user?.phone }}
        onBack={() => {}}
        onSave={(form) => {
          saveProfile(session.userId, form)
          toast('Profile updated.')
        }}
      />
    </div>
  )
}
