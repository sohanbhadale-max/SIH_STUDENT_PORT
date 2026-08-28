import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from '../db/database.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'skillbridge-secret-key-2026'

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { role, name, email, phone, password, ...profileData } = req.body
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const users = db.get('users')
    const existing = Object.values(users).find((u) => u.email?.toLowerCase() === cleanEmail)

    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' })
    }

    const id = `u-${Date.now()}`
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = {
      id,
      role,
      name,
      email: cleanEmail,
      phone: phone || '',
      password: password, // plaintext for dev compatibility
      hashedPassword,
      createdAt: new Date().toISOString()
    }

    const newProfile = {
      id,
      name,
      email: cleanEmail,
      phone: phone || '',
      role,
      ...profileData
    }

    // Save to DB
    const allUsers = { ...users, [id]: newUser }
    const allProfiles = { ...db.get('profiles'), [id]: newProfile }
    db.set('users', allUsers)
    db.set('profiles', allProfiles)

    const token = jwt.sign({ id, role, email: cleanEmail, name }, JWT_SECRET, { expiresIn: '7d' })

    return res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: newUser,
      profile: newProfile
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Server registration error.' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body
    if (!identifier) {
      return res.status(400).json({ error: 'Please provide email, phone, or name.' })
    }

    const rawId = identifier.trim().toLowerCase()
    const cleanId = rawId.replace(/\s+/g, '')
    const digitsId = rawId.replace(/\D/g, '')

    const users = db.get('users')
    const profiles = db.get('profiles')

    const user = Object.values(users).find((u) => {
      const uEmail = (u.email || '').toLowerCase()
      const uPhone = (u.phone || '').replace(/\D/g, '')
      const uId = (u.id || '').toLowerCase()
      const uName = (u.name || '').toLowerCase()

      return (
        uEmail === cleanId ||
        (uEmail.includes('@') && uEmail.split('@')[0] === cleanId) ||
        (digitsId && uPhone && uPhone.endsWith(digitsId)) ||
        uId === cleanId ||
        uName === rawId
      )
    })

    if (!user) {
      return res.status(404).json({ error: 'No registered account found for this identifier.' })
    }

    // Verify password if set and provided
    if (user.password && password && user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password. Please check your credentials.' })
    }

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' })
    const profile = profiles[user.id] || {}

    return res.json({
      message: 'Login successful.',
      token,
      user,
      profile
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Server login error.' })
  }
})

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token missing.' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = db.get('users')[decoded.id]
    const profile = db.get('profiles')[decoded.id] || {}
    if (!user) return res.status(404).json({ error: 'User no longer exists.' })
    return res.json({ user, profile })
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
})

export default router
