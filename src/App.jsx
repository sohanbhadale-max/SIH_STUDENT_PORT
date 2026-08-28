import { Component } from 'react'
import { StoreProvider, useStore } from './lib/store'
import { ToastProvider } from './components/ui'
import { I18nProvider } from './lib/i18n'
import { AuthFlow } from './screens/Auth'
import { StudentPortal } from './portals/student/StudentPortal'
import { IndustryPortal } from './portals/industry/IndustryPortal'
import { InstitutePortal } from './portals/institute/InstitutePortal'
import { FacultyPortal } from './portals/faculty/FacultyPortal'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('SkillBridge Portal Error Boundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    try {
      localStorage.removeItem('skillbridge.db.v1')
      localStorage.removeItem('skillbridge.session.v1')
    } catch (e) {
      console.warn('LocalStorage clear error:', e)
    }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1b24', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: 20 }}>
          <div style={{ maxWidth: 480, background: '#172a37', padding: 32, borderRadius: 12, border: '1px solid #2a4153', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🇮🇳</div>
            <h2 style={{ fontSize: 22, margin: '0 0 10px', color: '#f7c96b' }}>SkillBridge Portal Reload Required</h2>
            <p style={{ color: '#c8d3dc', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              The portal encountered a transient browser cache or data update. Click below to refresh your session.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#e8930c', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                ↻ Refresh Page
              </button>
              <button
                onClick={this.handleReset}
                style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #4a657a', background: 'transparent', color: '#c8d3dc', fontWeight: 600, cursor: 'pointer' }}
              >
                Clear Cache & Reset
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function Router() {
  const { db, session } = useStore()
  if (!session?.userId || !db?.users || !db.users[session.userId]) return <AuthFlow />
  const role = db.users[session.userId].role
  if (role === 'student') return <StudentPortal />
  if (role === 'industry') return <IndustryPortal />
  if (role === 'institute') return <InstitutePortal />
  return <FacultyPortal />
}

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ToastProvider>
          <StoreProvider>
            <Router />
          </StoreProvider>
        </ToastProvider>
      </I18nProvider>
    </ErrorBoundary>
  )
}
