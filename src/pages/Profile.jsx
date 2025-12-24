import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { trackProfileView, trackLinkClick, trackSessionEnd, processSessionQueue } from '../services/analytics'
import { getPlanFeatures } from '../services/payments'
// import fundo from '../assets/fundo.png'
import './Profile.css'

// Get favicon URL
const getFaviconUrl = (url) => {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return null
  }
}

const Profile = () => {
  const { username } = useParams()
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showAllLinks, setShowAllLinks] = useState(false)
  const viewTracked = useRef(false)
  const sessionStartTime = useRef(null)
  const userUid = useRef(null)
  const hasClickedLink = useRef(false)
  const sessionEnded = useRef(false)

  useEffect(() => {
    // Process any pending sessions from previous visits
    processSessionQueue()

    if (!sessionStartTime.current) {
      sessionStartTime.current = Date.now()
    }
    const fetchProfile = async () => {
      setLoading(true)
      setNotFound(false)

      try {
        const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()))

        if (!usernameDoc.exists()) {
          setNotFound(true)
          setLoading(false)
          return
        }

        const uid = usernameDoc.data().uid
        const userDoc = await getDoc(doc(db, 'users', uid))

        if (userDoc.exists()) {
          const data = userDoc.data()
          setProfileData(data)
          userUid.current = uid

          // Track profile view (only once per page load)
          if (!viewTracked.current) {
            viewTracked.current = true
            trackProfileView(username)
          }
        } else {
          setNotFound(true)
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error)
        setNotFound(true)
      }

      setLoading(false)
    }

    if (username) {
      fetchProfile()
    }

    // Handle session end when leaving the page or component
    const handleSessionEnd = () => {
      if (sessionEnded.current || !userUid.current) return
      sessionEnded.current = true

      const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000)
      if (duration > 0) {
        // Save to queue to ensure delivery even on abrupt exit
        const queue = JSON.parse(localStorage.getItem('pending_sessions') || '[]')
        queue.push({
          uid: userUid.current,
          duration,
          hasClicked: hasClickedLink.current,
          date: new Date().toISOString().split('T')[0]
        })
        localStorage.setItem('pending_sessions', JSON.stringify(queue))

        // Also try to send it immediately (fire and forget)
        trackSessionEnd(userUid.current, duration, hasClickedLink.current)
      }
    }

    window.addEventListener('beforeunload', handleSessionEnd)
    window.addEventListener('pagehide', handleSessionEnd)
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleSessionEnd()
      }
    })

    return () => {
      window.removeEventListener('beforeunload', handleSessionEnd)
      window.removeEventListener('pagehide', handleSessionEnd)
      handleSessionEnd()
    }
  }, [username])

  // Handle link click with tracking
  const handleLinkClick = (e, link) => {
    hasClickedLink.current = true
    // Track the click
    trackLinkClick(username, link.id)
    // Let the default navigation happen
  }

  if (loading) {
    return (
      <div className="profile-page-public">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="profile-page-public">
        <div className="profile-not-found">
          <div className="profile-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">LinkRole</span>
          </div>
          <span className="not-found-icon">🔍</span>
          <h1>Page not found</h1>
          <p>The user <strong>@{username}</strong> does not exist.</p>
          <a href="/" className="btn btn-primary">
            Create your free page
          </a>
        </div>
      </div>
    )
  }

  const theme = profileData?.theme || 'default'
  const links = profileData?.links || []


  // DEFAULT/AURORA/TECH LAYOUT RENDERING HELPERS
  const getAuroraLayout = () => {
    if (links.length === 0) return { mainLinks: [], iconLinks: [] }
    if (links.length === 1) return { mainLinks: links, iconLinks: [] }
    if (links.length === 2) return { mainLinks: [links[0]], iconLinks: [links[1]] }
    const iconCount = Math.min(4, links.length - 1)
    const mainLinks = links.slice(0, links.length - iconCount)
    const iconLinks = links.slice(-iconCount)
    return { mainLinks, iconLinks }
  }

  const renderDefaultLinks = () => {
    if (links.length === 0) {
      return (
        <div className="no-links-public">
          <p>No links added yet</p>
        </div>
      )
    }

    if (theme === 'gradient' || theme === 'elegante' || theme === 'tech') {
      const { mainLinks, iconLinks } = getAuroraLayout()
      return (
        <>
          {mainLinks.length > 0 && (
            <div className="main-links-section">
              {mainLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-button"
                  onClick={(e) => handleLinkClick(e, link)}
                >
                  <div className="link-favicon">
                    <img
                      src={getFaviconUrl(link.url)}
                      alt=""
                      onError={(e) => e.target.style.opacity = '0'}
                    />
                  </div>
                  <span className="link-title">{link.title}</span>
                  <svg className="link-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </a>
              ))}
            </div>
          )}
          {iconLinks.length > 0 && (
            <div className="icon-links-section">
              {iconLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-link"
                  title={link.title}
                  onClick={(e) => handleLinkClick(e, link)}
                >
                  <img
                    src={getFaviconUrl(link.url)}
                    alt={link.title}
                    onError={(e) => e.target.style.opacity = '0'}
                  />
                </a>
              ))}
            </div>
          )}
        </>
      )
    }

    // Neon theme with collapsible links
    if (theme === 'neon') {
      const largeButtons = links.slice(0, 3)
      const smallIconButtons = links.slice(3, 7)
      const hiddenLinks = links.slice(7)
      const visibleHiddenLinks = showAllLinks ? hiddenLinks : []

      return (
        <>
          {/* 3 Large Buttons */}
          <div className="main-links-section">
            {largeButtons.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-button"
                onClick={(e) => handleLinkClick(e, link)}
              >
                <div className="link-favicon">
                  <img
                    src={getFaviconUrl(link.url)}
                    alt=""
                    onError={(e) => e.target.style.opacity = '0'}
                  />
                </div>
                <span className="link-title">{link.title}</span>
                <svg className="link-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </a>
            ))}
          </div>

          {/* 4 Small Icon-Only Buttons */}
          {smallIconButtons.length > 0 && (
            <div className="small-icon-buttons">
              {smallIconButtons.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="small-icon-button"
                  title={link.title}
                  onClick={(e) => handleLinkClick(e, link)}
                >
                  <img
                    src={getFaviconUrl(link.url)}
                    alt={link.title}
                    onError={(e) => e.target.style.opacity = '0'}
                  />
                </a>
              ))}
            </div>
          )}

          {/* Hidden Links (shown when expanded) */}
          {visibleHiddenLinks.length > 0 && (
            <div className="main-links-section">
              {visibleHiddenLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-button"
                  onClick={(e) => handleLinkClick(e, link)}
                >
                  <div className="link-favicon">
                    <img
                      src={getFaviconUrl(link.url)}
                      alt=""
                      onError={(e) => e.target.style.opacity = '0'}
                    />
                  </div>
                  <span className="link-title">{link.title}</span>
                  <svg className="link-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </a>
              ))}
            </div>
          )}

          {/* Show More Button */}
          {hiddenLinks.length > 0 && (
            <button
              className="show-more-btn"
              onClick={() => setShowAllLinks(!showAllLinks)}
            >
              {showAllLinks ? 'Show less' : 'Show more'}
            </button>
          )}
        </>
      )
    }

    // Classic/Others List
    return (
      <div className="main-links-section">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link-button"
            onClick={(e) => handleLinkClick(e, link)}
          >
            <div className="link-favicon">
              <img
                src={getFaviconUrl(link.url)}
                alt=""
                onError={(e) => e.target.style.opacity = '0'}
              />
            </div>
            <span className="link-title">{link.title}</span>
            <svg className="link-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </a>
        ))}
      </div>
    )
  }

  return (
    <div className={`profile-page-public theme-${theme}`}>

      {!getPlanFeatures(profileData?.plan).limits.removeBranding && (
        <div className="profile-branding-top">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <span className="branding-icon">⚡</span>
            <span className="branding-text">LinkRole</span>
          </a>
        </div>
      )}

      {/* Render based on theme */}
      {theme === 'portfolio' ? (
        <PortfolioLayout
          profileData={profileData}
          links={links}
          handleLinkClick={handleLinkClick}
          showAllLinks={showAllLinks}
          setShowAllLinks={setShowAllLinks}
          portfolioColor={profileData?.portfolioColor || '#8b5cf6'}
        />
      ) : theme === 'orbit' ? (
        <OrbitLayout
          profileData={profileData}
          links={links}
          handleLinkClick={handleLinkClick}
          orbitColor={profileData?.orbitColor || '#8b5cf6'}
        />
      ) : (
        <div className="profile-container-public">
          <div className="profile-header-public">
            <div className="profile-avatar-public">
              {profileData?.photoURL ? (
                <img src={profileData.photoURL} alt={profileData.displayName} />
              ) : (
                <span className="avatar-placeholder-public">
                  {profileData?.displayName?.charAt(0) || profileData?.username?.charAt(0) || '?'}
                </span>
              )}
            </div>

            {theme === 'elegante' && (
              <div className="elegante-decorative-icon">
                <svg width="60" height="50" viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M30 5C30 5 20 15 20 25C20 30 24 35 30 35C36 35 40 30 40 25C40 15 30 5 30 5Z" stroke="#c9a227" strokeWidth="1.5" fill="none" />
                  <path d="M30 10C30 10 22 18 22 26C22 30 25.5 33 30 33C34.5 33 38 30 38 26C38 18 30 10 30 10Z" stroke="#c9a227" strokeWidth="1" fill="none" opacity="0.7" />
                  <path d="M15 20C15 20 22 22 26 28" stroke="#c9a227" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M45 20C45 20 38 22 34 28" stroke="#c9a227" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M10 30C10 30 18 28 24 32" stroke="#c9a227" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M50 30C50 30 42 28 36 32" stroke="#c9a227" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <circle cx="30" cy="42" r="3" stroke="#c9a227" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
            )}

            <h1 className="profile-name-public">{profileData?.displayName || profileData?.username}</h1>
            <p className="profile-username-public">@{profileData?.username}</p>
            {profileData?.bio && <p className="profile-bio-public">{profileData.bio}</p>}
          </div>

          <div className="profile-links-public">
            {renderDefaultLinks()}
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// SUB-COMPONENTS FOR NEW THEMES
// ==========================================

const PortfolioLayout = ({ profileData, links, handleLinkClick, showAllLinks, setShowAllLinks, portfolioColor }) => {
  const portfolioPhotos = profileData?.portfolioPhotos || []
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (portfolioPhotos.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % portfolioPhotos.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [portfolioPhotos.length])

  return (
    <div className="portfolio-layout" style={{ '--portfolio-color': portfolioColor }}>
      {/* Left: Links */}
      <div className="portfolio-col-left">
        <div className="portfolio-links-list">
          {(showAllLinks ? links : links.slice(0, 4)).map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-button"
              onClick={(e) => handleLinkClick(e, link)}
            >
              <div className="link-favicon">
                <img
                  src={getFaviconUrl(link.url)}
                  alt=""
                  onError={(e) => e.target.style.opacity = '0'}
                />
              </div>
              <span className="link-title">{link.title}</span>
              <svg className="link-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
          ))}

          {links.length > 4 && (
            <button
              className="portfolio-show-more"
              onClick={() => setShowAllLinks(!showAllLinks)}
            >
              {showAllLinks ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      </div>

      {/* Center: Profile */}
      <div className="portfolio-col-center">
        <div className="portfolio-profile-card">
          <div className="profile-avatar-public">
            {profileData?.photoURL ? (
              <img src={profileData.photoURL} alt={profileData.displayName} />
            ) : (
              <span className="avatar-placeholder-public">
                {profileData?.displayName?.charAt(0) || profileData?.username?.charAt(0) || '?'}
              </span>
            )}
          </div>
          <h1 className="profile-name-public">{profileData?.displayName || profileData?.username}</h1>
          <p className="profile-username-public">@{profileData?.username}</p>
          {profileData?.bio && <p className="profile-bio-public">{profileData.bio}</p>}
        </div>
      </div>

      {/* Right: Carousel */}
      <div className="portfolio-col-right">
        {portfolioPhotos.length > 0 ? (
          <div className="portfolio-carousel">
            {portfolioPhotos.map((photo, index) => (
              <div
                key={index}
                className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url(${photo})` }}
              />
            ))}
            {portfolioPhotos.length > 1 && (
              <div className="carousel-indicators">
                {portfolioPhotos.map((_, index) => (
                  <button
                    key={index}
                    className={`indicator ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="portfolio-carousel-placeholder">
            <p>Add photos in dashboard</p>
          </div>
        )}
      </div>
    </div>
  )
}

const OrbitLayout = ({ profileData, links, handleLinkClick, orbitColor }) => {
  // Top 6 links orbit (reduced from 8)
  const orbitLinks = links.slice(0, 6)
  const remainingLinks = links.slice(6)

  return (
    <div className="orbit-layout" style={{ '--orbit-color': orbitColor }}>
      {/* LEFT COLUMN: Orbit Animation */}
      <div className="orbit-col-left">
        <div className="orbit-container">
          <div className="orbit-center-avatar">
            {profileData?.photoURL ? (
              <img src={profileData.photoURL} alt={profileData.displayName} />
            ) : (
              <span className="avatar-placeholder-public">
                {profileData?.displayName?.charAt(0) || profileData?.username?.charAt(0) || '?'}
              </span>
            )}
          </div>

          <div className="orbit-ring">
            {orbitLinks.map((link, i) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="orbit-item"
                style={{ '--i': i, '--total': orbitLinks.length }}
                onClick={(e) => handleLinkClick(e, link)}
                title={link.title}
              >
                <div className="orbit-icon">
                  <img
                    src={getFaviconUrl(link.url)}
                    alt={link.title}
                    onError={(e) => e.target.style.opacity = '0'}
                  />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Bio & Remaining Links */}
      <div className="orbit-col-right">
        <div className="orbit-info-card">
          <h1 className="orbit-name">{profileData?.displayName}</h1>
          <p className="orbit-username">@{profileData?.username}</p>
          {profileData?.bio && <p className="orbit-bio">{profileData.bio}</p>}
        </div>

        {remainingLinks.length > 0 && (
          <div className="orbit-remaining-links">
            {remainingLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-button"
                onClick={(e) => handleLinkClick(e, link)}
              >
                <div className="link-favicon">
                  <img
                    src={getFaviconUrl(link.url)}
                    alt=""
                    onError={(e) => e.target.style.opacity = '0'}
                  />
                </div>
                <span className="link-title">{link.title}</span>
                <svg className="link-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
