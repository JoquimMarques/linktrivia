import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

const googleProvider = new GoogleAuthProvider()

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
    return { user: null, error: error.message }
  }
}

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
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
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth)
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Reset password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email)
    return { error: null }
  } catch (error) {
    return { error: error.message }
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
