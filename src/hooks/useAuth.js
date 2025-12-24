import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  signInWithGoogle,
  resetPassword 
} from '../services/auth'

export const useAuthActions = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const register = async (email, password, username) => {
    setLoading(true)
    setError(null)
    
    const { user, error } = await registerUser(email, password, username)
    
    if (error) {
      setError(error)
      setLoading(false)
      return false
    }
    
    setLoading(false)
    navigate('/dashboard')
    return true
  }

  const login = async (email, password) => {
    setLoading(true)
    setError(null)
    
    const { user, error } = await loginUser(email, password)
    
    if (error) {
      setError(error)
      setLoading(false)
      return false
    }
    
    setLoading(false)
    navigate('/dashboard')
    return true
  }

  const googleSignIn = async () => {
    setLoading(true)
    setError(null)
    
    const { user, error } = await signInWithGoogle()
    
    if (error) {
      setError(error)
      setLoading(false)
      return false
    }
    
    setLoading(false)
    navigate('/dashboard')
    return true
  }

  const logout = async () => {
    setLoading(true)
    
    const { error } = await logoutUser()
    
    if (error) {
      setError(error)
    }
    
    setLoading(false)
    navigate('/')
  }

  const forgotPassword = async (email) => {
    setLoading(true)
    setError(null)
    
    const { error } = await resetPassword(email)
    
    if (error) {
      setError(error)
      setLoading(false)
      return false
    }
    
    setLoading(false)
    return true
  }

  const clearError = () => setError(null)

  return {
    loading,
    error,
    register,
    login,
    googleSignIn,
    logout,
    forgotPassword,
    clearError
  }
}

export default useAuthActions


