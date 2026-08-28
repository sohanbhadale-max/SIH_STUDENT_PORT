// Cloud Storage & Cross-Laptop Synchronization Manager for SkillBridge
import { dbFirestore, rtdb, auth, signInAnonymously } from './firebase'
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'
import { ref, set, onValue, get } from 'firebase/database'

const CLOUD_DOC_PATH = 'skillbridge_v1_main'
const CLOUD_ACCOUNTS_PATH = 'skillbridge_v1_accounts'
const SYNC_CHANNEL_NAME = 'skillbridge_realtime_sync'

let isAuthInitialized = false

async function initCloudAuth() {
  if (isAuthInitialized || !auth) return
  try {
    isAuthInitialized = true
    await signInAnonymously(auth)
  } catch (err) {
    console.warn('Cloud Auth notice:', err.message)
  }
}

let broadcastChannel = null
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME)
  }
} catch { /* channel fallback */ }

export class CloudSyncEngine {
  static isSyncing = false

  // Fetch full cloud database snapshot AND cross-laptop created accounts
  static async fetchCloudState() {
    await initCloudAuth()
    let cloudDb = null
    let accountsMap = {}

    // A. Fetch main DB from Firestore
    if (dbFirestore) {
      try {
        const cloudRef = doc(dbFirestore, 'skillbridge_store', CLOUD_DOC_PATH)
        const docSnap = await getDoc(cloudRef)
        if (docSnap.exists() && docSnap.data()?.data) {
          cloudDb = JSON.parse(docSnap.data().data)
        }

        const accountsRef = doc(dbFirestore, 'skillbridge_store', CLOUD_ACCOUNTS_PATH)
        const accSnap = await getDoc(accountsRef)
        if (accSnap.exists() && accSnap.data()?.accounts) {
          accountsMap = accSnap.data().accounts
        }
      } catch (e) {
        console.warn('Firestore cloud fetch note:', e.message)
      }
    }

    // B. Fetch from Realtime Database as fallback/supplement
    if (rtdb) {
      try {
        const rtdbRef = ref(rtdb, 'store/main')
        const snapshot = await get(rtdbRef)
        if (snapshot.exists() && snapshot.val()?.data) {
          const rtdbData = JSON.parse(snapshot.val().data)
          if (!cloudDb) cloudDb = rtdbData
          else cloudDb = { ...cloudDb, users: { ...rtdbData.users, ...cloudDb.users }, profiles: { ...rtdbData.profiles, ...cloudDb.profiles } }
        }
      } catch { /* rtdb fallback */ }
    }

    // C. Read local storage cloud cache backup
    try {
      const localCloudBackup = localStorage.getItem('skillbridge.cloud.accounts')
      if (localCloudBackup) {
        const parsedBackup = JSON.parse(localCloudBackup)
        accountsMap = { ...parsedBackup, ...accountsMap }
      }
    } catch { /* ignore */ }

    // Merge accounts into cloudDb
    if (Object.keys(accountsMap).length > 0) {
      if (!cloudDb) cloudDb = { users: {}, profiles: {} }
      const mergedUsers = { ...cloudDb.users }
      const mergedProfiles = { ...cloudDb.profiles }
      Object.values(accountsMap).forEach(({ user, profile }) => {
        if (user && user.id) {
          mergedUsers[user.id] = user
          if (profile) mergedProfiles[user.id] = profile
        }
      })
      cloudDb.users = mergedUsers
      cloudDb.profiles = mergedProfiles
    }

    return cloudDb
  }

  // Push newly created user or full state to Cloud Storage
  static async pushToCloud(dbState) {
    if (this.isSyncing) return
    try {
      this.isSyncing = true
      await initCloudAuth()

      // Broadcast to local open tabs
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'REALTIME_STATE_UPDATE', payload: dbState, timestamp: Date.now() })
      }

      // 1. Save full state to Firestore
      if (dbFirestore) {
        const cloudRef = doc(dbFirestore, 'skillbridge_store', CLOUD_DOC_PATH)
        await setDoc(cloudRef, {
          data: JSON.stringify(dbState),
          updatedAt: new Date().toISOString(),
          version: '1.0'
        }, { merge: true })

        // Save users & profiles into accounts map
        const accountsMap = {}
        Object.values(dbState.users || {}).forEach((u) => {
          accountsMap[u.id] = { user: u, profile: dbState.profiles?.[u.id] }
        })
        const accountsRef = doc(dbFirestore, 'skillbridge_store', CLOUD_ACCOUNTS_PATH)
        await setDoc(accountsRef, { accounts: accountsMap, updatedAt: new Date().toISOString() }, { merge: true })
      }

      // 2. Save to Realtime Database
      if (rtdb) {
        try {
          const rtdbRef = ref(rtdb, 'store/main')
          await set(rtdbRef, {
            data: JSON.stringify(dbState),
            updatedAt: new Date().toISOString()
          })
        } catch { /* rtdb fallback */ }
      }

      // 3. Save to local storage backup
      try {
        localStorage.setItem('skillbridge.cloud.state', JSON.stringify(dbState))
        const accountsMap = {}
        Object.values(dbState.users || {}).forEach((u) => {
          accountsMap[u.id] = { user: u, profile: dbState.profiles?.[u.id] }
        })
        localStorage.setItem('skillbridge.cloud.accounts', JSON.stringify(accountsMap))
        window.dispatchEvent(new CustomEvent('skillbridge-cloud-event', { detail: dbState }))
      } catch { /* storage quota ignore */ }

    } catch (err) {
      console.warn('Cloud push notice:', err.message)
    } finally {
      this.isSyncing = false
    }
  }

  // Register a newly created user account to Cloud Storage immediately
  static async pushAccount(user, profile) {
    try {
      await initCloudAuth()

      // Firestore push
      if (dbFirestore) {
        const accountsRef = doc(dbFirestore, 'skillbridge_store', CLOUD_ACCOUNTS_PATH)
        await setDoc(accountsRef, {
          accounts: {
            [user.id]: { user, profile }
          },
          updatedAt: new Date().toISOString()
        }, { merge: true })
      }

      // Local storage backup
      try {
        const existing = JSON.parse(localStorage.getItem('skillbridge.cloud.accounts') || '{}')
        existing[user.id] = { user, profile }
        localStorage.setItem('skillbridge.cloud.accounts', JSON.stringify(existing))
      } catch { /* ignore */ }

    } catch (e) {
      console.warn('Push account note:', e.message)
    }
  }

  // Subscribe to real-time Cloud updates across all connected clients & laptops
  static subscribeToCloud(onUpdate) {
    const unsubscribers = []

    initCloudAuth().then(() => {
      if (dbFirestore) {
        try {
          const cloudRef = doc(dbFirestore, 'skillbridge_store', CLOUD_DOC_PATH)
          const unsubFirestore = onSnapshot(cloudRef, (docSnap) => {
            if (docSnap.exists()) {
              const raw = docSnap.data()?.data
              if (raw && !this.isSyncing) {
                try {
                  onUpdate(JSON.parse(raw))
                } catch { /* parse fail */ }
              }
            }
          }, (err) => {
            console.warn('Firestore realtime stream note:', err.message)
          })
          unsubscribers.push(unsubFirestore)
        } catch (e) {
          console.warn('Firestore subscription note:', e)
        }
      }

      if (rtdb) {
        try {
          const rtdbRef = ref(rtdb, 'store/main')
          const unsubRtdb = onValue(rtdbRef, (snapshot) => {
            if (snapshot.exists()) {
              const raw = snapshot.val()?.data
              if (raw && !this.isSyncing) {
                try {
                  onUpdate(JSON.parse(raw))
                } catch { /* parse error */ }
              }
            }
          })
          unsubscribers.push(() => unsubRtdb())
        } catch { /* RTDB fallback */ }
      }
    })

    if (broadcastChannel) {
      const handleBroadcast = (event) => {
        if (event.data?.type === 'REALTIME_STATE_UPDATE' && event.data.payload && !this.isSyncing) {
          onUpdate(event.data.payload)
        }
      }
      broadcastChannel.addEventListener('message', handleBroadcast)
      unsubscribers.push(() => broadcastChannel.removeEventListener('message', handleBroadcast))
    }

    const handleCustomEvent = (e) => {
      if (e.detail && !this.isSyncing) {
        onUpdate(e.detail)
      }
    }
    window.addEventListener('skillbridge-cloud-event', handleCustomEvent)
    unsubscribers.push(() => window.removeEventListener('skillbridge-cloud-event', handleCustomEvent))

    const handleStorageEvent = (e) => {
      if (e.key === 'skillbridge.db.v1' && e.newValue && !this.isSyncing) {
        try {
          onUpdate(JSON.parse(e.newValue))
        } catch { /* parse error */ }
      }
    }
    window.addEventListener('storage', handleStorageEvent)
    unsubscribers.push(() => window.removeEventListener('storage', handleStorageEvent))

    return () => {
      unsubscribers.forEach((fn) => { try { fn() } catch { /* cleanup */ } })
    }
  }

  // Node.js Express REST API Integration Methods
  static get API_BASE() {
    return typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:5000/api'
      : '/api'
  }

  static async apiPost(endpoint, body) {
    try {
      const res = await fetch(`${this.API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      return await res.json()
    } catch (err) {
      console.warn(`Backend API ${endpoint} notice:`, err.message)
      return null
    }
  }

  static async apiGet(endpoint) {
    try {
      const res = await fetch(`${this.API_BASE}${endpoint}`)
      return await res.json()
    } catch (err) {
      console.warn(`Backend API ${endpoint} notice:`, err.message)
      return null
    }
  }
}

