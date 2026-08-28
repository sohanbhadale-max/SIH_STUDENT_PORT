import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDemoConfigKeyForSkillBridgeApp2026",
  authDomain: "skillbridge-cloud-app.firebaseapp.com",
  databaseURL: "https://skillbridge-cloud-app-default-rtdb.firebaseio.com",
  projectId: "skillbridge-cloud-app",
  storageBucket: "skillbridge-cloud-app.appspot.com",
  messagingSenderId: "987654321012",
  appId: "1:987654321012:web:a1b2c3d4e5f6g7h8i9j0"
}

let app
let dbFirestore
let rtdb
let auth

try {
  app = initializeApp(firebaseConfig)
  dbFirestore = getFirestore(app)
  rtdb = getDatabase(app)
  auth = getAuth(app)
} catch (e) {
  console.warn('Firebase init note:', e)
}

export {
  app,
  dbFirestore,
  rtdb,
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
}
