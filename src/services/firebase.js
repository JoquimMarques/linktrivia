import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2wqDIgriCRbeTy4ZJ6F_QQw7nSXadjIo",
  authDomain: "venos-61916.firebaseapp.com",
  projectId: "venos-61916",
  storageBucket: "venos-61916.firebasestorage.app",
  messagingSenderId: "316937782596",
  appId: "1:316937782596:web:5dccbf5b4f2ab8a6498311",
  measurementId: "G-1VPR9FC6NP"
}

// Firebase is now configured
export const isFirebaseConfigured = true

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Analytics (only in browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null

export default app
