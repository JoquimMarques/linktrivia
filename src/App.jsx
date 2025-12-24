import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Pricing from './pages/Pricing'
import Profile from './pages/Profile'
import Analytics from './pages/Analytics'
import PrivateRoute from './components/PrivateRoute'

function App() {
  const location = useLocation()
  
  // Check if current page is a public profile page (not home, login, register, etc.)
  const isProfilePage = location.pathname !== '/' && 
                        location.pathname !== '/login' && 
                        location.pathname !== '/register' && 
                        location.pathname !== '/dashboard' && 
                        location.pathname !== '/pricing' &&
                        location.pathname !== '/analytics'

  return (
    <div className="app">
      {/* Only show Navbar on non-profile pages */}
      {!isProfilePage && <Navbar />}
      
      <main className={isProfilePage ? 'main-content-full' : 'main-content'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <PrivateRoute>
                <Analytics />
              </PrivateRoute>
            } 
          />
          <Route path="/:username" element={<Profile />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
