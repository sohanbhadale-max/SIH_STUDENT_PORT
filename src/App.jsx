import { StoreProvider, useStore } from './lib/store'
import { ToastProvider } from './components/ui'
import { AuthFlow } from './screens/Auth'
import { StudentPortal } from './portals/student/StudentPortal'
import { IndustryPortal } from './portals/industry/IndustryPortal'
import { InstitutePortal } from './portals/institute/InstitutePortal'
import { FacultyPortal } from './portals/faculty/FacultyPortal'

function Router() {
  const { db, session } = useStore()
  if (!session?.userId || !db.users[session.userId]) return <AuthFlow />
  const role = db.users[session.userId].role
  if (role === 'student') return <StudentPortal />
  if (role === 'industry') return <IndustryPortal />
  if (role === 'institute') return <InstitutePortal />
  return <FacultyPortal />
}

export default function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <Router />
      </StoreProvider>
    </ToastProvider>
  )
}
