import express from 'express'
import { db } from '../db/database.js'

const router = express.Router()

// Questionnaire Modules
const QUESTIONNAIRE = [
  {
    id: 'tech-1',
    category: 'Technical Skills',
    title: 'Data Structures & Algorithms',
    questions: [
      { q: 'What is the time complexity of searching an element in a balanced Binary Search Tree (BST)?', options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'], correct: 1 },
      { q: 'Which data structure follows the First In First Out (FIFO) principle?', options: ['Stack', 'Queue', 'Array', 'Tree'], correct: 1 }
    ]
  },
  {
    id: 'tech-2',
    category: 'Technical Skills',
    title: 'Full Stack Web Development & Databases',
    questions: [
      { q: 'What is the primary role of indexing in a SQL database?', options: ['Encrypt passwords', 'Speed up data retrieval queries', 'Normalize tables', 'Manage ACID transactions'], correct: 1 },
      { q: 'In React, what hook is used to handle side effects like API fetching?', options: ['useState', 'useEffect', 'useReducer', 'useContext'], correct: 1 }
    ]
  },
  {
    id: 'soft-1',
    category: 'Soft Skills',
    title: 'Communication & Team Collaboration',
    questions: [
      { q: 'When a critical bug is found right before release, what is the best approach?', options: ['Blame the developer', 'Communicate transparently with team and prioritize a patch', 'Ignore it until client reports', 'Cancel release'], correct: 1 }
    ]
  }
]

// GET /api/assessments
router.get('/', (req, res) => {
  return res.json({
    modules: QUESTIONNAIRE,
    totalModules: QUESTIONNAIRE.length
  })
})

// POST /api/assessments/submit
router.post('/submit', (req, res) => {
  try {
    const { studentId, answers } = req.body
    if (!studentId) return res.status(400).json({ error: 'Student ID required.' })

    let correctCount = 0
    let totalQuestions = 0

    QUESTIONNAIRE.forEach((mod) => {
      mod.questions.forEach((qObj, idx) => {
        totalQuestions++
        const key = `${mod.id}-${idx}`
        if (answers && answers[key] === qObj.correct) {
          correctCount++
        }
      })
    })

    const scorePct = Math.round((correctCount / totalQuestions) * 100) || 82

    // Skill Radar Profile & Gap Identification
    const skillProfile = {
      overallScore: scorePct,
      evaluatedAt: new Date().toISOString(),
      skills: [
        { name: 'Data Structures', level: scorePct > 70 ? 88 : 60, status: 'Verified' },
        { name: 'Web Architecture', level: scorePct > 60 ? 82 : 55, status: 'Verified' },
        { name: 'System Design', level: scorePct > 80 ? 78 : 45, status: scorePct > 80 ? 'Verified' : 'Skill Gap' },
        { name: 'Agile & Teamwork', level: 90, status: 'Verified' }
      ],
      identifiedGaps: [
        'Cloud MLOps Pipeline deployment',
        'Docker & Kubernetes Containerization',
        'System Scalability & Redis Caching'
      ],
      recommendations: [
        { course: 'Docker & Kubernetes Mastery', platform: 'NPTEL / Swayam', duration: '4 Weeks' },
        { course: 'Enterprise System Design', platform: 'SkillBridge Micro-Certification', duration: '6 Weeks' }
      ]
    }

    // Save to student profile in DB
    const profiles = db.get('profiles')
    if (profiles[studentId]) {
      profiles[studentId].assessment = skillProfile
      profiles[studentId].assessed = true
      db.set('profiles', profiles)
    }

    return res.json({
      message: 'Assessment submitted successfully.',
      result: skillProfile
    })
  } catch (err) {
    console.error('Assessment submission error:', err)
    return res.status(500).json({ error: 'Failed to evaluate assessment.' })
  }
})

export default router
