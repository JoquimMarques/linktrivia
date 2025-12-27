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
                  {isDarkMode ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>
                <button onClick={logout} className="btn btn-ghost btn-sm">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="nav-auth">
              <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
                {isDarkMode ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
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
