import express from 'express'
import { db } from '../db/database.js'

const router = express.Router()

// GET /api/postings/internships
router.get('/internships', (req, res) => {
  const internships = db.get('internships')
  return res.json(internships)
})

// POST /api/postings/internships
router.post('/internships', (req, res) => {
  const { title, duration, stipend, type, location, requiredSkills, description, companyId, company } = req.body
  if (!title || !companyId) {
    return res.status(400).json({ error: 'Title and company details are required.' })
  }

  const newInternship = {
    id: `int-${Date.now()}`,
    companyId,
    company: company || 'TechCorp',
    title,
    duration: duration || '3 Months',
    stipend: stipend || '₹25,000 / month',
    type: type || 'Hybrid',
    location: location || 'Bangalore, India',
    requiredSkills: requiredSkills || ['React', 'Node.js'],
    description: description || 'Exciting industry internship opportunity with hands-on projects.',
    postedAt: new Date().toISOString()
  }

  const current = db.get('internships')
  db.set('internships', [newInternship, ...current])

  return res.status(201).json(newInternship)
})

// GET /api/postings/jobs
router.get('/jobs', (req, res) => {
  const jobs = db.get('jobs')
  return res.json(jobs)
})

// POST /api/postings/jobs
router.post('/jobs', (req, res) => {
  const { title, salary, experience, location, requiredSkills, description, companyId, company } = req.body
  if (!title || !companyId) {
    return res.status(400).json({ error: 'Title and company details are required.' })
  }

  const newJob = {
    id: `job-${Date.now()}`,
    companyId,
    company: company || 'TechCorp',
    title,
    salary: salary || '8 – 12 LPA',
    experience: experience || '0-1 Years',
    location: location || 'Bangalore, India',
    requiredSkills: requiredSkills || ['Python', 'System Design'],
    description: description || 'Entry-level job opportunity for high-performing graduates.',
    postedAt: new Date().toISOString()
  }

  const current = db.get('jobs')
  db.set('jobs', [newJob, ...current])

  return res.status(201).json(newJob)
})

export default router
