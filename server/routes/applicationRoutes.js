import express from 'express'
import { db } from '../db/database.js'

const router = express.Router()

// GET /api/applications
router.get('/', (req, res) => {
  const { applicantId, companyId, kind } = req.query
  let apps = db.get('applications')

  if (applicantId) apps = apps.filter((a) => a.applicantId === applicantId)
  if (kind) apps = apps.filter((a) => a.kind === kind)

  return res.json(apps)
})

// POST /api/applications (Apply for Job/Internship)
router.post('/', (req, res) => {
  const { applicantId, postingId, kind } = req.body
  if (!applicantId || !postingId || !kind) {
    return res.status(400).json({ error: 'Applicant ID, posting ID, and kind (job/internship) are required.' })
  }

  const apps = db.get('applications')
  const existing = apps.find((a) => a.applicantId === applicantId && a.postingId === postingId)
  if (existing) {
    return res.status(400).json({ error: 'You have already applied for this opening.' })
  }

  const newApp = {
    id: `app-${Date.now()}`,
    applicantId,
    postingId,
    kind,
    status: 'applied',
    appliedAt: new Date().toISOString()
  }

  db.set('applications', [newApp, ...apps])
  return res.status(201).json(newApp)
})

// POST /api/applications/:id/interview (Schedule Interview)
router.post('/:id/interview', (req, res) => {
  const { id } = req.params
  const { date, time, mode, link, notes } = req.body

  const apps = db.get('applications')
  const index = apps.findIndex((a) => a.id === id)
  if (index === -1) return res.status(404).json({ error: 'Application not found.' })

  apps[index].status = 'interview'
  apps[index].interview = {
    date: date || '2026-09-10',
    time: time || '11:00 AM IST',
    mode: mode || 'Online (Google Meet)',
    link: link || 'https://meet.google.com/sb-interview-room',
    notes: notes || 'Please have your resume and GitHub project links ready.',
    scheduledAt: new Date().toISOString()
  }

  db.set('applications', apps)
  return res.json({ message: 'Interview scheduled successfully.', application: apps[index] })
})

// POST /api/applications/:id/clear-interview (Mark Interview Cleared)
router.post('/:id/clear-interview', (req, res) => {
  const { id } = req.params
  const apps = db.get('applications')
  const index = apps.findIndex((a) => a.id === id)
  if (index === -1) return res.status(404).json({ error: 'Application not found.' })

  apps[index].status = 'interview_cleared'
  db.set('applications', apps)

  return res.json({ message: 'Interview marked as cleared/passed. Offer letter unlocked!', application: apps[index] })
})

// POST /api/applications/:id/offer (Send Offer Letter)
router.post('/:id/offer', (req, res) => {
  const { id } = req.params
  const { letterText } = req.body

  const apps = db.get('applications')
  const index = apps.findIndex((a) => a.id === id)
  if (index === -1) return res.status(404).json({ error: 'Application not found.' })

  if (apps[index].status !== 'interview_cleared') {
    return res.status(400).json({ error: 'Candidate must clear the interview before an offer letter can be issued.' })
  }

  apps[index].status = 'offer'
  apps[index].offer = {
    sentAt: new Date().toISOString(),
    letter: letterText || 'Congratulations! We are pleased to offer you the position.',
    response: 'pending'
  }

  db.set('applications', apps)
  return res.json({ message: 'Formal offer letter sent to candidate.', application: apps[index] })
})

// POST /api/applications/:id/respond-offer (Accept/Decline Offer)
router.post('/:id/respond-offer', (req, res) => {
  const { id } = req.params
  const { response } = req.body // 'accepted' | 'declined'

  const apps = db.get('applications')
  const index = apps.findIndex((a) => a.id === id)
  if (index === -1) return res.status(404).json({ error: 'Application not found.' })

  const app = apps[index]
  if (!app.offer) return res.status(400).json({ error: 'No offer letter found for this application.' })

  app.offer.response = response
  app.offer.respondedAt = new Date().toISOString()

  if (response === 'accepted') {
    app.status = 'accepted'

    // Update student placed profile
    const profiles = db.get('profiles')
    if (profiles[app.applicantId]) {
      const job = db.get('jobs').find((j) => j.id === app.postingId)
      profiles[app.applicantId].placed = {
        company: job?.company || 'Leading Industry Firm',
        packageLPA: job?.salary || '9.5 LPA',
        date: new Date().toISOString()
      }
      db.set('profiles', profiles)
    }
  } else {
    app.status = 'declined'
  }

  db.set('applications', apps)
  return res.json({ message: `Offer ${response} successfully.`, application: app })
})

export default router
