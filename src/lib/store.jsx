import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { uid, todayISO, clamp, skillLevel } from './util'
import { CloudSyncEngine } from './cloudSync'
import {
  seedCompanies, seedInstitutes, seedInstitute, seedFaculty, seedStudents, seedJobs,
  seedInternships, seedCourses, seedFdps, seedAnnouncements, INTEREST_AREAS,
} from './seed'

const DB_KEY = 'skillbridge.db.v1'
const SESSION_KEY = 'skillbridge.session.v1'

// interest area ↔ skill affinity, used to derive posting interests
const SKILL_INTEREST = {
  Python: ['Software Development', 'Data Science & Analytics', 'Machine Learning & AI'],
  Java: ['Software Development'], 'Spring Boot': ['Software Development'], JavaScript: ['Software Development', 'Design & UX'],
  React: ['Software Development', 'Design & UX'], SQL: ['Data Science & Analytics', 'Software Development', 'Finance & Risk'],
  AWS: ['Cloud & DevOps'], Linux: ['Cloud & DevOps'], C: ['Embedded Systems'], 'C++': ['Embedded Systems'],
  'Embedded C': ['Embedded Systems'], RTOS: ['Embedded Systems'], 'Machine Learning': ['Machine Learning & AI'],
  Statistics: ['Data Science & Analytics', 'Finance & Risk'], 'Power BI': ['Data Science & Analytics', 'Finance & Risk'],
  Excel: ['Data Science & Analytics', 'Finance & Risk'],
}

export const postingInterests = (posting) => {
  const set = new Set(posting.tags || [])
  for (const s of posting.skills || []) for (const i of SKILL_INTEREST[s] || []) set.add(i)
  return [...set]
}

// ---------- seed assembly ----------
function buildSeed() {
  const users = {}
  const profiles = {}
  const put = (id, role, name, email, phone, profile) => {
    users[id] = { id, role, name, email, phone, createdAt: todayISO() }
    profiles[id] = profile
  }
  for (const c of seedCompanies) put(c.userId, 'industry', c.name, c.email, c.phone, c)
  const insts = seedInstitutes || [seedInstitute]
  for (const inst of insts) put(inst.userId, 'institute', inst.name, inst.email, inst.phone, inst)
  for (const f of seedFaculty) put(f.userId, 'faculty', f.name, f.email, f.phone, f)
  for (const s of seedStudents) {
    const { userId, name, email, phone, ...profile } = s
    put(userId, 'student', name, email, phone, profile)
  }
  return {
    users, profiles,
    jobs: seedJobs, internships: seedInternships, courses: seedCourses, fdps: seedFdps,
    applications: [
      // Rahul already placed through TechNova SWE role, for demo realism
      { id: 'app-seed-1', kind: 'job', postingId: 'j-swe', applicantId: 'u-rahul', status: 'accepted', appliedAt: todayISO(), match: 88, offer: { letter: 'Dear Rahul,\n\nWe are delighted to offer you the position of Software Engineer at TechNova Solutions at 9.5 LPA.\n\nWarm regards,\nHR Team, TechNova', sentAt: todayISO(), response: 'accepted' } },
    ],
    enrollments: [{ id: 'enr-1', userId: 'u-priya', courseId: 'c-sql', status: 'completed', completedAt: todayISO(), certificate: { id: 'SB-CERT-20441', issuedAt: todayISO() } }],
    assessments: {
      'u-priya': {
        takenAt: todayISO(), overall: 78,
        scores: { Python: { score: 85, level: 'Advanced' }, SQL: { score: 80, level: 'Advanced' }, Java: { score: 70, level: 'Advanced' }, 'Problem Solving': { score: 75, level: 'Advanced' } },
      },
    },
    announcements: seedAnnouncements,
    notifications: [],
    ignored: {},
  }
}

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* fall through to seed */ }
  return buildSeed()
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { return null }
}

// ---------- reducer ----------
function reducer(db, act) {
  switch (act.type) {
    case 'CREATE_USER': {
      const { user, profile } = act
      return { ...db, users: { ...db.users, [user.id]: user }, profiles: { ...db.profiles, [user.id]: profile } }
    }
    case 'SAVE_PROFILE':
      return { ...db, profiles: { ...db.profiles, [act.userId]: { ...db.profiles[act.userId], ...act.patch } } }
    case 'SUBMIT_ASSESSMENT':
      return { ...db, assessments: { ...db.assessments, [act.userId]: act.result } }
    case 'ENROLL':
      return { ...db, enrollments: [...db.enrollments, { id: uid(), userId: act.userId, courseId: act.courseId, status: 'enrolled', enrolledAt: todayISO() }] }
    case 'COMPLETE_COURSE':
      return {
        ...db,
        enrollments: db.enrollments.map((e) =>
          e.userId === act.userId && e.courseId === act.courseId
            ? { ...e, status: 'completed', completedAt: todayISO(), certificate: { id: `SB-CERT-${Math.floor(10000 + Math.random() * 89999)}`, issuedAt: todayISO() } }
            : e),
      }
    case 'APPLY':
      return { ...db, applications: [...db.applications, act.application] }
    case 'IGNORE': {
      const cur = db.ignored[act.userId] || {}
      return { ...db, ignored: { ...db.ignored, [act.userId]: { ...cur, [act.postingId]: true } } }
    }
    case 'APP_UPDATE': {
      const app = db.applications.find((a) => a.id === act.appId)
      const nextApps = db.applications.map((a) => (a.id === act.appId ? { ...a, ...act.patch } : a))
      let nextProfiles = db.profiles
      if (act.patch.status === 'accepted' && app) {
        const job = db.jobs.find((j) => j.id === app.postingId)
        const companyName = db.users[job?.companyId]?.name || job?.company || 'Company'
        const currentProf = db.profiles[app.applicantId] || {}
        nextProfiles = {
          ...db.profiles,
          [app.applicantId]: {
            ...currentProf,
            placed: { company: companyName, packageLPA: job?.salary || '8 LPA', date: todayISO() }
          }
        }
      }
      return { ...db, applications: nextApps, profiles: nextProfiles }
    }
    case 'SCHEDULE_INTERVIEW': {
      const { appId, interview } = act
      const app = db.applications.find((a) => a.id === appId)
      if (!app) return db
      const posting = db.jobs.find((j) => j.id === app.postingId) || db.internships.find((i) => i.id === app.postingId)
      const companyName = posting?.company || 'Recruiter'
      const notif = {
        id: uid(),
        userId: app.applicantId,
        icon: 'calendar',
        text: `🎉 Interview Scheduled with ${companyName} for ${interview.date} at ${interview.time}! (${interview.mode})`,
        read: false,
        createdAt: todayISO()
      }
      return {
        ...db,
        applications: db.applications.map((a) => (a.id === appId ? { ...a, status: 'interviewing', interview } : a)),
        notifications: [notif, ...db.notifications]
      }
    }
    case 'ANNOUNCE':
      return { ...db, announcements: [act.announcement, ...db.announcements] }
    case 'DELETE_ANNOUNCEMENT':
      return { ...db, announcements: db.announcements.filter((a) => a.id !== act.announcementId) }
    case 'NOTIFY':
      return { ...db, notifications: [act.notification, ...db.notifications] }
    case 'MARK_READ':
      return { ...db, notifications: db.notifications.map((n) => (n.userId === act.userId ? { ...n, read: true } : n)) }
    case 'POST_POSTING':
      return act.kind === 'job' ? { ...db, jobs: [act.posting, ...db.jobs] } : { ...db, internships: [act.posting, ...db.internships] }
    case 'DELETE_USER': {
      const { userId } = act
      const nextUsers = { ...db.users }
      const nextProfiles = { ...db.profiles }
      const nextAssessments = { ...db.assessments }
      delete nextUsers[userId]
      delete nextProfiles[userId]
      delete nextAssessments[userId]
      return {
        ...db,
        users: nextUsers,
        profiles: nextProfiles,
        assessments: nextAssessments,
        applications: db.applications.filter((a) => a.applicantId !== userId),
        enrollments: db.enrollments.filter((e) => e.userId !== userId),
      }
    }
    case 'CLOUD_SYNC':
      return { ...db, ...act.payload }
    case 'RESET':
      return buildSeed()
    default:
      return db
  }
}

// ---------- selectors & scoring ----------
export const userOf = (db, id) => db.users[id]
export const profileOf = (db, id) => db.profiles[id] || {}
export const postingById = (db, kind, id) => (kind === 'job' ? db.jobs : db.internships).find((p) => p.id === id)

export function verifiedSkills(db, userId) {
  const a = db.assessments[userId]
  return a ? Object.keys(a.scores) : null
}

export function displayedSkills(db, userId) {
  const p = profileOf(db, userId)
  return verifiedSkills(db, userId) ?? []
}

export function matchScore(db, userId, posting) {
  const p = profileOf(db, userId)
  const a = db.assessments[userId]
  const skills = (verifiedSkills(db, userId) ?? p.skills ?? [])
  const need = posting.skills || []
  const overlap = need.filter((s) => skills.includes(s)).length
  const skillPart = need.length ? overlap / need.length : 0.6
  const assessPart = a ? a.overall / 100 : 0.45
  const pInterests = p.interests || []
  const postInterests = postingInterests(posting)
  const interestPart = postInterests.length ? postInterests.filter((i) => pInterests.includes(i)).length / postInterests.length : 0.5
  const eduPart = (p.degree || p.eduLevel) ? 0.8 : 0.5
  return clamp(Math.round(100 * (0.5 * skillPart + 0.25 * assessPart + 0.15 * interestPart + 0.1 * eduPart)))
}

export function employability(db, userId) {
  const p = profileOf(db, userId)
  const a = db.assessments[userId]
  const skills = verifiedSkills(db, userId) ?? p.skills ?? []
  const base = a ? a.overall : 40
  const breadth = Math.min(1, skills.length / 5) * 100
  const coursesDone = (p.coursesDone || 0) + db.enrollments.filter((e) => e.userId === userId && e.status === 'completed').length
  const coursePart = Math.min(1, coursesDone / 2) * 100
  const expPart = p.placed || p.internshipDone || db.applications.some((x) => x.applicantId === userId && x.status === 'completed') ? 100 : 0
  return clamp(Math.round(0.4 * base + 0.25 * breadth + 0.15 * coursePart + 0.2 * expPart))
}

export function verifiedSignalScore(db, userId) {
  const p = profileOf(db, userId)
  const a = db.assessments[userId]
  const assessSignal = a ? Math.round((a.overall / 100) * 40) : 15
  const certsDone = db.enrollments.filter((e) => e.userId === userId && e.status === 'completed').length
  const courseSignal = Math.min(20, certsDone * 10)
  const projCount = (p.projects || []).length
  const projSignal = Math.min(15, projCount * 5)
  const internDone = p.internshipDone || db.applications.some((x) => x.applicantId === userId && x.status === 'completed')
  const internSignal = internDone ? 15 : 0
  const skillsCount = (verifiedSkills(db, userId) || []).length
  const skillSignal = Math.min(10, Math.round(skillsCount * 3.33))

  return Math.min(100, Math.round(assessSignal + courseSignal + projSignal + internSignal + skillSignal))
}

export function eligibleInternships(db, userId) {
  const ignored = db.ignored[userId] || {}
  const applied = new Set(db.applications.filter((a) => a.applicantId === userId).map((a) => a.postingId))
  return db.internships
    .filter((i) => !ignored[i.id] && !applied.has(i.id))
    .map((i) => ({ posting: i, score: matchScore(db, userId, i) }))
    .filter((x) => x.score >= x.posting.minScore)
    .sort((a, b) => b.score - a.score)
}

export function recommendedCourses(db, userId) {
  const p = profileOf(db, userId)
  const enrolledIds = new Set(db.enrollments.filter((e) => e.userId === userId).map((e) => e.courseId))
  const skills = verifiedSkills(db, userId) ?? p.skills ?? []
  return db.courses
    .filter((c) => !enrolledIds.has(c.id))
    .map((c) => {
      let score = 0
      if ((p.interests || []).some((i) => c.interests.includes(i))) score += 2
      if (p.jobInterest && c.title.toLowerCase().includes(p.jobInterest.split(' ')[0].toLowerCase())) score += 1
      if (!skills.includes(c.skill)) score += 1
      return { course: c, score }
    })
    .sort((a, b) => b.score - a.score)
}

export function candidateMatches(db, companyId) {
  const company = profileOf(db, companyId)
  const tags = company.tags || []
  const desc = (company.description || '').toLowerCase()
  return Object.entries(db.users)
    .filter(([, u]) => u.role === 'student')
    .map(([id]) => {
      const p = profileOf(db, id)
      const skills = verifiedSkills(db, id) ?? p.skills ?? []
      let score = 0
      for (const t of tags) if ((p.interests || []).includes(t)) score += 25
      for (const s of skills) if (desc.includes(s.toLowerCase())) score += 15
      const emp = employability(db, id)
      return { userId: id, profile: p, name: db.users[id].name, score: clamp(score + Math.round(emp / 2)), employability: emp }
    })
    .sort((a, b) => b.score - a.score)
}

export function departmentStats(db, instituteId) {
  const inst = profileOf(db, instituteId)
  const instName = inst.name || db.users[instituteId]?.name
  const students = Object.entries(db.users)
    .filter(([, u]) => u.role === 'student')
    .map(([id, u]) => ({ id, ...profileOf(db, id), name: u.name }))
    .filter((s) => !instName || s.institute === instName)
  const depts = {}
  for (const s of students) {
    const d = s.department || 'Other'
    depts[d] = depts[d] || { students: [], placed: 0, interned: 0, assessed: 0, empSum: 0, skillCount: {} }
    const stats = depts[d]
    stats.students.push(s)
    if (s.placed) stats.placed += 1
    if (s.internshipDone) stats.interned += 1
    if (db.assessments[s.id]) stats.assessed += 1
    stats.empSum += employability(db, s.id)
    for (const sk of verifiedSkills(db, s.id) ?? s.skills ?? []) stats.skillCount[sk] = (stats.skillCount[sk] || 0) + 1
  }
  const totalStudents = students.length || 1
  return Object.entries(depts).map(([name, st]) => ({
    name,
    count: st.students.length,
    employability: Math.round(st.empSum / st.students.length),
    placed: st.placed, interned: st.interned, assessed: st.assessed,
    topSkills: Object.entries(st.skillCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([skill, n]) => ({ skill, pct: Math.round((100 * n) / st.students.length) })),
    students: st.students,
  }))
}

export function requiredSkillsStats(db) {
  const counts = {}
  for (const list of [db.jobs, db.internships])
    for (const p of list) for (const s of p.skills || []) counts[s] = (counts[s] || 0) + 1
  const students = Object.values(db.users).filter((u) => u.role === 'student')
  const total = students.length || 1
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([skill, demand]) => {
      const have = students.filter((s) => {
        const p = profileOf(db, s.id)
        return (verifiedSkills(db, s.id) ?? p.skills ?? []).includes(skill)
      }).length
      return { skill, demand, coverage: Math.round((100 * have) / total) }
    })
}

export const notificationsFor = (db, userId) => db.notifications.filter((n) => n.userId === userId)
export const appsFor = (db, userId) => db.applications.filter((a) => a.applicantId === userId)
export const unreadCount = (db, userId) => notificationsFor(db, userId).filter((n) => !n.read).length

// ---------- context ----------
const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [db, dispatch] = useReducer(reducer, undefined, loadDb)
  const [session, setSession] = useSessionState()

  useEffect(() => {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch { /* storage full — ignore in prototype */ }
    CloudSyncEngine.pushToCloud(db)
  }, [db])

  useEffect(() => {
    // 1. Initial Cloud Sync Fetch on App Mount
    CloudSyncEngine.fetchCloudState().then((cloudData) => {
      if (cloudData) dispatch({ type: 'CLOUD_SYNC', payload: cloudData })
    })

    // 2. Realtime Cloud Listener Subscription
    const unsub = CloudSyncEngine.subscribeToCloud((cloudState) => {
      dispatch({ type: 'CLOUD_SYNC', payload: cloudState })
    })
    return unsub
  }, [])

  const api = useMemo(() => ({
    db, session,
    dispatch,
    login(userId, userObj, profileObj) {
      if (userObj && !db.users[userId]) {
        dispatch({ type: 'CREATE_USER', user: userObj, profile: profileObj || {} })
      }
      setSession({ userId })
    },
    logout() { setSession(null) },
    createUser(user, profile) {
      dispatch({ type: 'CREATE_USER', user, profile })
      CloudSyncEngine.pushAccount(user, profile)
      setSession({ userId: user.id })
    },
    saveProfile: (userId, patch) => dispatch({ type: 'SAVE_PROFILE', userId, patch }),
    submitAssessment: (userId, result) => dispatch({ type: 'SUBMIT_ASSESSMENT', userId, result }),
    enroll: (userId, courseId) => dispatch({ type: 'ENROLL', userId, courseId }),
    completeCourse: (userId, courseId) => dispatch({ type: 'COMPLETE_COURSE', userId, courseId }),
    apply(application) { dispatch({ type: 'APPLY', application }) },
    ignore: (userId, postingId) => dispatch({ type: 'IGNORE', userId, postingId }),
    updateApplication: (appId, patch) => dispatch({ type: 'APP_UPDATE', appId, patch }),
    scheduleInterview: (appId, interview) => dispatch({ type: 'SCHEDULE_INTERVIEW', appId, interview }),
    announce: (announcement) => dispatch({ type: 'ANNOUNCE', announcement }),
    deleteAnnouncement: (announcementId) => dispatch({ type: 'DELETE_ANNOUNCEMENT', announcementId }),
    notify: (userId, text, meta = {}) => dispatch({ type: 'NOTIFY', notification: { id: uid(), userId, text, read: false, createdAt: todayISO(), ...meta } }),
    markRead: (userId) => dispatch({ type: 'MARK_READ', userId }),
    postPosting: (kind, posting) => dispatch({ type: 'POST_POSTING', kind, posting }),
    removeStudent: (userId) => dispatch({ type: 'DELETE_USER', userId }),
    resetDemo: () => { dispatch({ type: 'RESET' }); setSession(null) },
  }), [db, session])

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>
}

// tiny session state hook with persistence
function useSessionState() {
  const [session, set] = useState(loadSession)
  useEffect(() => {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      else localStorage.removeItem(SESSION_KEY)
    } catch { /* ignore */ }
  }, [session])
  return [session, set]
}

export const useStore = () => useContext(StoreCtx)

export { INTEREST_AREAS }
