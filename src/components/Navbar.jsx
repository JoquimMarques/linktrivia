import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAuthActions } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import './Navbar.css'
import logo from '../assets/logo.png'

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, userData } = useAuth()
  const { logout } = useAuthActions()
  const { isDarkMode, toggleTheme } = useTheme()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon"><img src={logo} alt="Logo" /></span>
          <span className="logo-text"></span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links">
          <Link
            to="/pricing"
            className={`nav-link ${isActive('/pricing') ? 'active' : ''}`}
          >
            Pricing
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <Link
                to="/analytics"
                className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}
              >
                Analytics
              </Link>
              <div className="nav-user">
                <Link to={`/${userData?.username || ''}`} className="nav-avatar">
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt={userData.displayName} />
                  ) : (
                    <span>{userData?.displayName?.charAt(0) || 'U'}</span>
                  )}
                </Link>
                <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
                  {isDarkMode ? '🌞' : '🌙'}
                </button>
                <button onClick={logout} className="btn btn-ghost btn-sm">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="nav-auth">
              <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
                {isDarkMode ? '🌞' : '🌙'}
              </button>
              <Link to="/login" className="btn btn-ghost">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <Link
          to="/pricing"
          className="mobile-link"
          onClick={() => setMobileMenuOpen(false)}
        >
          Pricing
        </Link>

        {isAuthenticated ? (
          <>
            <Link
              to="/dashboard"
              className="mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/analytics"
              className="mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Analytics
            </Link>
            <Link
              to={`/${userData?.username || ''}`}
              className="mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              My Profile
            </Link>
            <button
              onClick={() => { logout(); setMobileMenuOpen(false); }}
              className="mobile-link"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="mobile-link highlight"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
            <button
              onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
              className="mobile-link"
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
