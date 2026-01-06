import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

const googleProvider = new GoogleAuthProvider()

// Translate Firebase error codes to user-friendly messages
const getErrorMessage = (error) => {
  const errorCode = error?.code || ''

  const errorMessages = {
    // Authentication errors
    'auth/invalid-email': 'Invalid email. Please check the format.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid credentials. Please check your details.',
    'auth/email-already-in-use': 'This email is already in use.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/operation-not-allowed': 'This login method is not enabled.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes.',

    // Google Sign-In errors
    'auth/popup-blocked': 'Popup blocked by browser. Please allow popups and try again.',
    'auth/popup-closed-by-user': 'Login cancelled. Please try again.',
    'auth/cancelled-popup-request': 'Login cancelled. Please try again.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different login method.',
    'auth/credential-already-in-use': 'This credential is already associated with another account.',
    'auth/auth-domain-config-required': 'Configuration error. Please contact support.',
    'auth/unauthorized-domain': 'This domain is not authorized for login.',

    // Network errors
    'auth/network-request-failed': 'Connection error. Please check your internet.',
    'auth/timeout': 'Request timed out. Please try again.',

    // Redirect errors (common on mobile)
    'auth/redirect-cancelled-by-user': 'Login cancelled. Please try again.',
    'auth/redirect-operation-pending': 'A login is already in progress. Please wait.',

    // General errors
    'auth/internal-error': 'Internal error. Please try again later.',
    'auth/invalid-api-key': 'Configuration error. Please contact support.',
    'auth/app-deleted': 'Application not configured correctly.'
  }

  return errorMessages[errorCode] || 'An error occurred. Please try again.'
}

// Register new user
export const registerUser = async (email, password, username) => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update profile with username
    await updateProfile(user, {
      displayName: username
    })

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      username: username.toLowerCase(),
      displayName: username,
      photoURL: null,
      bio: '',
      links: [],
      theme: 'default',
      plan: 'free',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Create username document for uniqueness check
    await setDoc(doc(db, 'usernames', username.toLowerCase()), {
      uid: user.uid
    })

    return { user, error: null }
  } catch (error) {
    return { user: null, error: getErrorMessage(error) }
  }
}

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error) {
    return { user: null, error: getErrorMessage(error) }
  }
}

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    // Check if we're on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    let user

    if (isMobile) {
      // Use redirect for mobile devices
      await signInWithRedirect(auth, googleProvider)
      // The result will be handled by handleGoogleRedirect
      return { user: null, error: null, redirecting: true }
    } else {
      // Use popup for desktop
      const result = await signInWithPopup(auth, googleProvider)
      user = result.user
    }

    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid))

    if (!userDoc.exists()) {
      // Create new user document
      const username = user.email.split('@')[0] + Math.random().toString(36).slice(-4)

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        username: username.toLowerCase(),
        displayName: user.displayName || username,
        photoURL: user.photoURL,
        bio: '',
        links: [],
        theme: 'default',
        plan: 'free',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      await setDoc(doc(db, 'usernames', username.toLowerCase()), {
        uid: user.uid
      })
    } else {
      // Update email if missing or different (ensures premium validation works)
      const existingData = userDoc.data()
      if (!existingData.email || existingData.email !== user.email) {
        await updateDoc(doc(db, 'users', user.uid), {
          email: user.email,
          updatedAt: serverTimestamp()
        })
      }
    }

    return { user, error: null }
  } catch (error) {
    // If popup is blocked or fails, try redirect
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      try {
        await signInWithRedirect(auth, googleProvider)
        return { user: null, error: null, redirecting: true }
      } catch (redirectError) {
        return { user: null, error: getErrorMessage(redirectError) }
      }
    }
    return { user: null, error: getErrorMessage(error) }
  }
}

// Handle Google redirect result
export const handleGoogleRedirect = async () => {
  try {
    const result = await getRedirectResult(auth)

    if (result) {
      const user = result.user

      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', user.uid))

      if (!userDoc.exists()) {
        // Create new user document
        const username = user.email.split('@')[0] + Math.random().toString(36).slice(-4)

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          username: username.toLowerCase(),
          displayName: user.displayName || username,
          photoURL: user.photoURL,
          bio: '',
          links: [],
          theme: 'default',
          plan: 'free',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        await setDoc(doc(db, 'usernames', username.toLowerCase()), {
          uid: user.uid
        })
      } else {
        // Update email if missing or different (ensures premium validation works)
        const existingData = userDoc.data()
        if (!existingData.email || existingData.email !== user.email) {
          await updateDoc(doc(db, 'users', user.uid), {
            email: user.email,
            updatedAt: serverTimestamp()
          })
        }
      }

      return { user, error: null }
    }

    return { user: null, error: null }
  } catch (error) {
    return { user: null, error: getErrorMessage(error) }
  }
}

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth)
    return { error: null }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email)
    return { error: null }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}

// Check if username is available
export const checkUsernameAvailability = async (username) => {
  try {
    const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()))
    return !usernameDoc.exists()
  } catch (error) {
    console.error('Error checking username:', error)
    return false
  }
}

// Get user data from Firestore
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      return { data: userDoc.data(), error: null }
    }
    return { data: null, error: 'User not found' }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

// Auth state observer
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

// Update username
export const updateUsername = async (uid, oldUsername, newUsername) => {
  try {
    const normalizedNew = newUsername.toLowerCase().trim()
    const normalizedOld = oldUsername.toLowerCase()

    // Validate username format
    if (!/^[a-z0-9_]{3,20}$/.test(normalizedNew)) {
      return {
        success: false,
        error: 'Username deve ter entre 3-20 caracteres (letras, números ou _)'
      }
    }

    // Check if username is available
    const isAvailable = await checkUsernameAvailability(normalizedNew)
    if (!isAvailable && normalizedNew !== normalizedOld) {
      return { success: false, error: 'Este username já está em uso' }
    }

    // If same username, no need to change
    if (normalizedNew === normalizedOld) {
      return { success: true, error: null }
    }

    // Delete old username document
    await deleteDoc(doc(db, 'usernames', normalizedOld))

    // Create new username document
    await setDoc(doc(db, 'usernames', normalizedNew), {
      uid: uid
    })

    // Update user document
    await updateDoc(doc(db, 'users', uid), {
      username: normalizedNew,
      updatedAt: serverTimestamp()
    })

    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating username:', error)
    return { success: false, error: error.message }
  }
}
