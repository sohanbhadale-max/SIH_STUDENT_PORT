import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  seedCompanies, seedInstitutes, seedInstitute, seedFaculty, seedStudents, seedJobs,
  seedInternships, seedCourses, seedFdps, seedAnnouncements
} from '../../src/lib/seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_FILE = path.join(__dirname, 'data.json')

function buildSeedData() {
  const users = {}
  const profiles = {}
  const put = (id, role, name, email, phone, profile) => {
    users[id] = { id, role, name, email, phone, createdAt: new Date().toISOString() }
    profiles[id] = profile
  }
  for (const c of seedCompanies) put(c.userId, 'industry', c.name, c.email, c.phone, c)
  const insts = seedInstitutes || [seedInstitute]
  for (const inst of insts) put(inst.userId, 'institute', inst.name, inst.email, inst.phone, inst)
  for (const f of seedFaculty) put(f.userId, 'faculty', f.name, f.email, f.phone, f)
  for (const s of seedStudents) put(s.userId, 'student', s.name, s.email, s.phone, s)

  const applications = [
    { id: 'app-priya-i1', applicantId: 'u-priya', postingId: 'i-fsd', kind: 'internship', status: 'shortlisted', appliedAt: '2026-08-20' },
    { id: 'app-priya-j1', applicantId: 'u-priya', postingId: 'j-se', kind: 'job', status: 'interview_cleared', appliedAt: '2026-08-22' }
  ]

  const facultyOpportunities = [
    {
      id: 'fdp-101',
      title: 'Advanced AI & Machine Learning Faculty Development Program (FDP)',
      type: 'FDP',
      organizer: 'Google Cloud & Sunfield Institute',
      domain: 'Artificial Intelligence',
      duration: '2 Weeks (Online + Hands-on Lab)',
      stipend: 'Fully Funded by MSDE',
      description: 'Intensive FDP covering Deep Learning, Transformer Architectures, and MLOps deployment.',
      eligibility: 'Assistant Professors & HODs in CSE/IT/ECE',
      postedAt: '2026-08-15',
      applicants: ['u-meera']
    },
    {
      id: 'ind-201',
      title: '6-Month Industrial Research Fellowship in EV Mobility Systems',
      type: 'Industrial Training',
      organizer: 'Tata Motors R&D Center',
      domain: 'Automotive & Embedded Systems',
      duration: '6 Months (On-site Pune)',
      stipend: '₹45,000 / month',
      description: 'Immersive industrial exposure to Battery Management Systems (BMS) and CAN bus protocols.',
      eligibility: 'Electrical, Mechanical & Mechatronics Faculty',
      postedAt: '2026-08-20',
      applicants: []
    }
  ]

  const collaborations = [
    {
      id: 'col-1',
      title: 'National Hackathon: AI for Sustainable Agriculture',
      type: 'Innovation Challenge',
      industry: 'Meta & AgriTech India',
      deadline: '2026-09-30',
      prizePool: '₹5,000,000',
      description: 'Solve real-world crop yield prediction and soil health diagnostics using computer vision.',
      participantsCount: 142
    },
    {
      id: 'col-2',
      title: 'Weekly Mentorship Series: System Design & Cloud Architecture',
      type: 'Mentorship Program',
      industry: 'Amazon Web Services (AWS)',
      schedule: 'Every Saturday, 5 PM IST',
      mentor: 'Rajesh Verma (Principal Architect, AWS)',
      description: 'Direct 1-on-1 mentorship for final year students building distributed systems.',
      participantsCount: 88
    }
  ]

  return {
    users,
    profiles,
    internships: seedInternships,
    jobs: seedJobs,
    applications,
    learning: seedCourses,
    facultyOpportunities,
    collaborations,
    announcements: seedAnnouncements,
    lastUpdated: new Date().toISOString()
  }
}

class Database {
  constructor() {
    this.data = null
    this.init()
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8')
        this.data = JSON.parse(raw)
      } else {
        this.data = buildSeedData()
        this.save()
      }
    } catch (err) {
      console.error('Database load error, fallback to default:', err)
      this.data = buildSeedData()
    }
  }

  save() {
    try {
      this.data.lastUpdated = new Date().toISOString()
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8')
    } catch (err) {
      console.error('Database save error:', err)
    }
  }

  get(collection) {
    return this.data[collection] || []
  }

  set(collection, value) {
    this.data[collection] = value
    this.save()
  }
}

export const db = new Database()
