import { apiPost } from './cloudSync'

export function createProctorMonitor(studentId, onViolation) {
  let integrityScore = 100
  let isMonitoring = false
  const auditLogs = []

  const logViolation = async (eventType, details) => {
    if (!isMonitoring) return

    let penalty = 10
    if (eventType === 'TAB_SWITCH') penalty = 15
    if (eventType === 'FULLSCREEN_EXIT') penalty = 20
    if (eventType === 'DEVTOOLS_OPEN') penalty = 30
    if (eventType === 'WINDOW_BLUR') penalty = 10
    if (eventType === 'SCREEN_SHARE_DETECTED') penalty = 25

    integrityScore = Math.max(0, integrityScore - penalty)

    const entry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentId,
      eventType,
      details,
      timestamp: new Date().toISOString(),
      integrityScore
    }

    auditLogs.push(entry)

    // Notify caller UI
    if (onViolation) {
      onViolation({
        eventType,
        details,
        integrityScore,
        riskLevel: integrityScore < 65 ? 'High Risk' : integrityScore < 85 ? 'Moderate Risk' : 'Low Risk',
        logs: auditLogs
      })
    }

    // Post to secure backend server for SHA-256 cryptographic signing
    try {
      await apiPost('/api/proctor/log-violation', {
        studentId,
        assessmentId: 'assessment-v1',
        eventType,
        details
      })
    } catch (e) {
      // Offline fallback log
    }
  }

  // Event Listeners
  const handleVisibilityChange = () => {
    if (document.hidden) {
      logViolation('TAB_SWITCH', 'Student switched tabs or minimized browser window.')
    }
  }

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      logViolation('FULLSCREEN_EXIT', 'Student exited enforced full-screen mode.')
    }
  }

  const handleBlur = () => {
    logViolation('WINDOW_BLUR', 'Browser window lost focus (Alt-Tab or desktop interaction).')
  }

  const handleKeyDown = (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
    ) {
      e.preventDefault()
      logViolation('DEVTOOLS_OPEN', 'Shortcut for Developer Tools / Inspect Element pressed.')
    }
  }

  // Heuristic check for DevTools window resizing
  let devtoolsInterval = null
  const checkDevToolsResize = () => {
    const threshold = 160
    const widthDiff = window.outerWidth - window.innerWidth > threshold
    const heightDiff = window.outerHeight - window.innerHeight > threshold
    if (widthDiff || heightDiff) {
      logViolation('DEVTOOLS_OPEN', 'DevTools panel height/width discrepancy detected.')
    }
  }

  return {
    start() {
      isMonitoring = true
      document.addEventListener('visibilitychange', handleVisibilityChange)
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      window.addEventListener('blur', handleBlur)
      window.addEventListener('keydown', handleKeyDown)
      devtoolsInterval = setInterval(checkDevToolsResize, 3000)

      // Request Fullscreen if supported
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    },

    stop() {
      isMonitoring = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('keydown', handleKeyDown)
      if (devtoolsInterval) clearInterval(devtoolsInterval)

      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
    },

    getIntegrityScore() {
      return integrityScore
    },

    getLogs() {
      return auditLogs
    }
  }
}
