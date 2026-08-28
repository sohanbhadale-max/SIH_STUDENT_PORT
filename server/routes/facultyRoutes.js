import express from 'express'
import { db } from '../db/database.js'

const router = express.Router()

// GET /api/faculty/opportunities
router.get('/opportunities', (req, res) => {
  const opps = db.get('facultyOpportunities')
  return res.json(opps)
})

// POST /api/faculty/opportunities (Post FDP / Consultancy)
router.post('/opportunities', (req, res) => {
  const { title, type, domain, duration, stipend, description, eligibility, organizer } = req.body
  if (!title || !organizer) {
    return res.status(400).json({ error: 'Title and organizer details required.' })
  }

  const newOpp = {
    id: `opp-${Date.now()}`,
    title,
    type: type || 'FDP',
    organizer,
    domain: domain || 'Cross-disciplinary',
    duration: duration || '1 Month',
    stipend: stipend || 'Fully Funded',
    description: description || 'Academician industrial training and capacity building initiative.',
    eligibility: eligibility || 'All Faculty Members',
    postedAt: new Date().toISOString(),
    applicants: []
  }

  const opps = db.get('facultyOpportunities')
  db.set('facultyOpportunities', [newOpp, ...opps])

  return res.status(201).json(newOpp)
})

// POST /api/faculty/apply (Apply for FDP / Research Project)
router.post('/apply', (req, res) => {
  const { facultyId, opportunityId } = req.body
  if (!facultyId || !opportunityId) {
    return res.status(400).json({ error: 'Faculty ID and Opportunity ID are required.' })
  }

  const opps = db.get('facultyOpportunities')
  const index = opps.findIndex((o) => o.id === opportunityId)
  if (index === -1) return res.status(404).json({ error: 'Opportunity not found.' })

  if (!opps[index].applicants.includes(facultyId)) {
    opps[index].applicants.push(facultyId)
    db.set('facultyOpportunities', opps)
  }

  return res.json({ message: 'Applied for faculty development opportunity successfully.', opportunity: opps[index] })
})

export default router
