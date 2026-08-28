import express from 'express'
import { db } from '../db/database.js'

const router = express.Router()

// GET /api/analytics/overview
router.get('/overview', (req, res) => {
  const users = db.get('users')
  const profiles = db.get('profiles')
  const applications = db.get('applications')

  const students = Object.values(users).filter((u) => u.role === 'student')
  const totalStudents = students.length
  const totalInstitutes = Object.values(users).filter((u) => u.role === 'institute').length
  const totalIndustries = Object.values(users).filter((u) => u.role === 'industry').length

  const placedStudents = students.filter((u) => profiles[u.id]?.placed).length
  const internedStudents = students.filter((u) => profiles[u.id]?.internshipDone).length

  const placementRate = totalStudents ? Math.round((placedStudents / totalStudents) * 100) : 0

  // Skill demand analytics
  const skillDemand = [
    { skill: 'React & Frontend', demand: 42, coverage: 78 },
    { skill: 'Python & Data Science', demand: 38, coverage: 64 },
    { skill: 'System Design & Distributed DB', demand: 35, coverage: 42 },
    { skill: 'Docker & DevOps MLOps', demand: 28, coverage: 31 },
    { skill: 'Cybersecurity & Auditing', demand: 22, coverage: 55 }
  ]

  return res.json({
    metrics: {
      totalStudents,
      totalInstitutes,
      totalIndustries,
      placedStudents,
      internedStudents,
      placementRatePct: placementRate,
      activeApplications: applications.length
    },
    skillDemand
  })
})

export default router
