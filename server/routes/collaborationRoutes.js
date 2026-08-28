import express from 'express'
import { db } from '../db/database.js'

const router = express.Router()

// GET /api/collaboration/initiatives
router.get('/initiatives', (req, res) => {
  const collaborations = db.get('collaborations')
  return res.json(collaborations)
})

// POST /api/collaboration/initiatives
router.post('/initiatives', (req, res) => {
  const { title, type, industry, description, prizePool, schedule } = req.body
  if (!title || !industry) {
    return res.status(400).json({ error: 'Title and industry partner are required.' })
  }

  const newCollab = {
    id: `collab-${Date.now()}`,
    title,
    type: type || 'Workshops & Mentorship',
    industry,
    description: description || 'Collaborative initiative bridging industry expertise with academia.',
    prizePool: prizePool || 'N/A',
    schedule: schedule || 'Upcoming Session',
    participantsCount: 1
  }

  const current = db.get('collaborations')
  db.set('collaborations', [newCollab, ...current])

  return res.status(201).json(newCollab)
})

export default router
