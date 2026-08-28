import express from 'express'
import { db } from '../db/database.js'

const router = express.Router()

// GET /api/students (directory)
router.get('/', (req, res) => {
  const { institute, department, q } = req.query
  const users = db.get('users')
  const profiles = db.get('profiles')

  let students = Object.values(users)
    .filter((u) => u.role === 'student')
    .map((u) => ({ user: u, profile: profiles[u.id] || {} }))

  if (institute && institute !== 'ALL') {
    students = students.filter(({ profile }) => profile.institute === institute)
  }
  if (department) {
    students = students.filter(({ profile }) => profile.department === department)
  }
  if (q) {
    const term = q.toLowerCase()
    students = students.filter(({ user, profile }) => {
      return (
        user.name?.toLowerCase().includes(term) ||
        profile.degree?.toLowerCase().includes(term) ||
        profile.skills?.some((s) => s.toLowerCase().includes(term))
      )
    })
  }

  return res.json(students)
})

// GET /api/students/:id/portfolio (Digital Student Portfolio)
router.get('/:id/portfolio', (req, res) => {
  const { id } = req.params
  const users = db.get('users')
  const profiles = db.get('profiles')

  const user = users[id]
  const profile = profiles[id]

  if (!user || user.role !== 'student') {
    return res.status(404).json({ error: 'Student not found.' })
  }

  // Compile full Digital Portfolio
  const portfolio = {
    studentId: id,
    name: user.name,
    email: profile?.email || user.email,
    phone: profile?.phone || user.phone,
    institute: profile?.institute || 'Sunfield Institute of Technology',
    department: profile?.department || 'Computer Science & Engineering',
    degree: profile?.degree || 'B.Tech CSE',
    cgpa: profile?.cgpa || '8.9 / 10',
    verifiedSkills: profile?.skills || ['React', 'Node.js', 'Python', 'SQL'],
    certifications: profile?.certifications || [
      { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2025-11-10' },
      { name: 'Full Stack Web Development', issuer: 'SkillBridge & MSDE', date: '2026-02-15' }
    ],
    projects: profile?.projects || [
      { title: 'AI-Based Skill Gap Analyzer', tech: 'React, Node.js, TensorFlow', link: 'https://github.com/example/skill-analyzer' },
      { title: 'Smart Campus IoT Infrastructure', tech: 'Python, MQTT, Postgres', link: 'https://github.com/example/iot-campus' }
    ],
    internships: profile?.internshipDone ? [
      { company: 'Google Cloud India', role: 'Cloud Engineer Intern', duration: '3 Months (Summer 2025)' }
    ] : [],
    placedRecord: profile?.placed || null,
    resumeUrl: profile?.resumeUrl || '/docs/sample_resume.pdf'
  }

  return res.json(portfolio)
})

// DELETE /api/students/:id (Remove student profile)
router.delete('/:id', (req, res) => {
  const { id } = req.params
  const users = db.get('users')
  const profiles = db.get('profiles')

  if (!users[id]) return res.status(404).json({ error: 'Student profile not found.' })

  delete users[id]
  delete profiles[id]

  db.set('users', users)
  db.set('profiles', profiles)

  return res.json({ message: 'Student profile deleted from database.' })
})

export default router
