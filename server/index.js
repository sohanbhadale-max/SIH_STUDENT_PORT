import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/authRoutes.js'
import assessmentRoutes from './routes/assessmentRoutes.js'
import studentRoutes from './routes/studentRoutes.js'
import postingRoutes from './routes/postingRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import facultyRoutes from './routes/facultyRoutes.js'
import collaborationRoutes from './routes/collaborationRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/assessments', assessmentRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/postings', postingRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/faculty', facultyRoutes)
app.use('/api/collaboration', collaborationRoutes)
app.use('/api/analytics', analyticsRoutes)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SkillBridge Academia-Industry Backend API',
    timestamp: new Date().toISOString()
  })
})

// Serve static build dist if available
const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next()
  })
})

app.listen(PORT, () => {
  console.log(`🚀 SkillBridge Express Backend Server running on http://localhost:${PORT}`)
})
