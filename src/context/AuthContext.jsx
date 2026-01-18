import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import { getUserData, handleGoogleRedirect } from '../services/auth'
import { getEffectivePlan } from '../services/payments'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Handle Google redirect result on app load
    const checkRedirectResult = async () => {
      try {
        await handleGoogleRedirect()
      } catch (error) {
        console.error('Error handling Google redirect:', error)
      }
    }
    checkRedirectResult()
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)

        // Fetch additional user data from Firestore
        const { data } = await getUserData(firebaseUser.uid)

        // Apply system overrides and check expiration
        const effectivePlan = getEffectivePlan(data, firebaseUser.email)

        // If data exists but plan in Firestore is different from effective plan (expiration), update it
        if (data && data.plan !== effectivePlan && effectivePlan === 'free') {
          try {
            const { doc, updateDoc } = await import('firebase/firestore')
            const { db } = await import('../services/firebase')
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              plan: 'free',
              planExpiredAt: new Date().toISOString()
            })
          } catch (e) {
            console.error('Error auto-downgrading expired plan:', e)
          }
        }

        setUserData(data ? { ...data, plan: effectivePlan } : null)
      } else {
        setUser(null)
        setUserData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const refreshUserData = async () => {
    if (user) {
      const { data } = await getUserData(user.uid)
      const effectivePlan = getEffectivePlan(data, user.email)

      // Auto-downgrade check on refresh too
      if (data && data.plan !== effectivePlan && effectivePlan === 'free') {
        try {
          const { doc, updateDoc } = await import('firebase/firestore')
          const { db } = await import('../services/firebase')
          await updateDoc(doc(db, 'users', user.uid), {
            plan: 'free',
            planExpiredAt: new Date().toISOString()
          })
        } catch (e) {
          console.error('Error auto-downgrading expired plan on refresh:', e)
        }
      }

      setUserData(data ? { ...data, plan: effectivePlan } : null)
    }
  }

  const value = {
    user,
    userData,
    loading,
    isAuthenticated: !!user,
    refreshUserData
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export default AuthContext
