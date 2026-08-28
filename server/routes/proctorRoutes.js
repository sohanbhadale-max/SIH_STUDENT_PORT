import express from 'express'
import { db } from '../db/database.js'
import { generateAuditHash, enforceRole } from '../security/cryptoHelper.js'

const router = express.Router()

// In-memory / DB proctor audit logs
if (!db.proctorLogs) {
  db.proctorLogs = {}
}

/**
 * POST /api/proctor/log-violation
 * Log tab switches, fullscreen exit, DevTools, focus loss with SHA-256 signatures
 */
router.post('/log-violation', (req, res) => {
  try {
    const { studentId, assessmentId, eventType, details } = req.body
    if (!studentId) return res.status(400).json({ error: 'Student ID required.' })

    const timestamp = new Date().toISOString()
    const rawPayload = { studentId, assessmentId: assessmentId || 'assess-v1', eventType, details, timestamp }
    const auditHash = generateAuditHash(rawPayload)

    const logEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...rawPayload,
      sha256Signature: auditHash
    }

    if (!db.proctorLogs[studentId]) {
      db.proctorLogs[studentId] = []
    }
    db.proctorLogs[studentId].push(logEntry)

    // Calculate updated Integrity Score & Risk Level
    const logs = db.proctorLogs[studentId]
    let integrityScore = 100

    logs.forEach((entry) => {
      if (entry.eventType === 'TAB_SWITCH') integrityScore -= 15
      if (entry.eventType === 'FULLSCREEN_EXIT') integrityScore -= 20
      if (entry.eventType === 'DEVTOOLS_OPEN') integrityScore -= 30
      if (entry.eventType === 'WINDOW_BLUR') integrityScore -= 10
      if (entry.eventType === 'SCREEN_SHARE_DETECTED') integrityScore -= 25
    })

    integrityScore = Math.max(0, Math.min(100, integrityScore))

    let riskLevel = 'Low Risk'
    if (integrityScore < 65) riskLevel = 'High Risk - Flagged for Review'
    else if (integrityScore < 85) riskLevel = 'Moderate Risk'

    return res.json({
      message: 'Proctor violation logged with cryptographic audit signature.',
      integrityScore,
      riskLevel,
      logEntry
    })
  } catch (err) {
    console.error('Proctor log error:', err)
    return res.status(500).json({ error: 'Failed to record proctor violation.' })
  }
})

/**
 * GET /api/proctor/audit-trail/:studentId
 * Restricted to Institute / Faculty / Admin roles (Privacy-by-Design)
 */
router.get('/audit-trail/:studentId', enforceRole(['institute', 'faculty', 'admin', '*']), (req, res) => {
  const { studentId } = req.params
  const logs = db.proctorLogs[studentId] || []
  
  let integrityScore = 100
  logs.forEach((entry) => {
    if (entry.eventType === 'TAB_SWITCH') integrityScore -= 15
    if (entry.eventType === 'FULLSCREEN_EXIT') integrityScore -= 20
    if (entry.eventType === 'DEVTOOLS_OPEN') integrityScore -= 30
    if (entry.eventType === 'WINDOW_BLUR') integrityScore -= 10
  })
  integrityScore = Math.max(0, Math.min(100, integrityScore))

  return res.json({
    studentId,
    integrityScore,
    riskLevel: integrityScore < 65 ? 'High Risk' : integrityScore < 85 ? 'Moderate Risk' : 'Low Risk',
    totalViolations: logs.length,
    auditTrail: logs
  })
})

export default router
