import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { trackProfileView, trackLinkClick, trackSessionEnd, processSessionQueue } from '../services/analytics'
import { getPlanFeatures, getEffectivePlan } from '../services/payments'
import logoWhite from '../assets/logo.png'
import logoBlack from '../assets/logoblack.png'
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
          // Apply system overrides for plan
          const effectivePlan = getEffectivePlan(data?.plan, data?.email)
          setProfileData({ ...data, plan: effectivePlan })
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
            <span className="logo-text">Orbilink</span>
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
    <div
      className={`profile-page-public theme-${theme}`}
      style={
        theme === 'glass' && profileData?.glassBackground
          ? { backgroundImage: `url(${profileData.glassBackground})` }
          : theme === 'default'
            ? { '--classic-color': profileData?.classicColor || '#0ea5e9' }
            : undefined
      }
    >

      {!getPlanFeatures(profileData?.plan).limits.removeBranding && (
        <div className="profile-branding-top">
          <a href="/" target="_blank" rel="noopener noreferrer" title="Orbilink">
            <img
              src={theme === 'elegante' ? logoBlack : logoWhite}
              alt="Orbilink"
              className="branding-logo"
            />
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
      ) : theme === 'modern' ? (
        <ModernLayout
          profileData={profileData}
          links={links}
          handleLinkClick={handleLinkClick}
        />
      ) : theme === 'brand' ? (
        <BrandLayout
          profileData={profileData}
          links={links}
          handleLinkClick={handleLinkClick}
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

            <h1 className="profile-name-public">
              {profileData?.displayName || profileData?.username}
              {(profileData?.plan === 'pro' || profileData?.plan === 'premium') && (
                <span className="verified-badge" title="Verified Pro">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#1D9BF0" />
                    <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </h1>
            <p className="profile-username-public">@{profileData?.username}</p>
            {profileData?.bio && <p className="profile-bio-public">{profileData.bio}</p>}

            {/* Action Buttons - Phone, Email, Share (Share only for non-classic themes) */}
            {(profileData?.phone || profileData?.email || !['default', 'classic-light'].includes(theme)) && (
              <div className="profile-action-buttons">
                {profileData?.phone && (
                  <a href={`tel:${profileData.phone}`} className="profile-action-btn" title="Call">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </a>
                )}
                {profileData?.email && (
                  <a href={`mailto:${profileData.email}`} className="profile-action-btn" title="Email">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </a>
                )}
                {/* Share button - NOT on classic themes */}
                {!['default', 'classic-light'].includes(theme) && (
                  <button
                    className="profile-action-btn"
                    title="Share"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: profileData?.displayName || profileData?.username,
                          url: window.location.href
                        })
                      } else {
                        navigator.clipboard.writeText(window.location.href)
                        alert('Link copied!')
                      }
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                )}
              </div>
            )}
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
          <h1 className="profile-name-public">
            {profileData?.displayName || profileData?.username}
            {(profileData?.plan === 'pro' || profileData?.plan === 'premium') && (
              <span className="verified-badge" title="Verified Pro">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#1D9BF0" />
                  <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </h1>
          <p className="profile-username-public">@{profileData?.username}</p>
          {profileData?.bio && <p className="profile-bio-public">{profileData.bio}</p>}

          {/* Action Buttons */}
          {(profileData?.phone || profileData?.email) && (
            <div className="profile-action-buttons" style={{ '--action-color': portfolioColor }}>
              {profileData?.phone && (
                <a href={`tel:${profileData.phone}`} className="profile-action-btn" title="Call">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </a>
              )}
              {profileData?.email && (
                <a href={`mailto:${profileData.email}`} className="profile-action-btn" title="Email">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </a>
              )}
              <button
                className="profile-action-btn"
                title="Share"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: profileData?.displayName || profileData?.username,
                      url: window.location.href
                    })
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                    alert('Link copied!')
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>
          )}
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
  const canvasRef = useRef(null)

  // Particle animation effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationFrameId
    let particles = []

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    // Create particles
    const createParticles = () => {
      particles = []
      const particleCount = 50
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.2
        })
      }
    }

    // Animate particles
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(particle => {
        // Update position
        particle.x += particle.speedX
        particle.y += particle.speedY

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = orbitColor || '#f97316'
        ctx.globalAlpha = particle.opacity
        ctx.fill()
      })

      ctx.globalAlpha = 1
      animationFrameId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    createParticles()
    animate()

    window.addEventListener('resize', () => {
      resizeCanvas()
      createParticles()
    })

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [orbitColor])

  return (
    <div className="orbit-layout" style={{ '--orbit-color': orbitColor }}>
      {/* Particle Canvas Background */}
      <canvas ref={canvasRef} className="orbit-particles-canvas" />
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
          <h1 className="orbit-name">
            {profileData?.displayName}
            {(profileData?.plan === 'pro' || profileData?.plan === 'premium') && (
              <span className="verified-badge" title="Verified Pro">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#1D9BF0" />
                  <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </h1>
          <p className="orbit-username">@{profileData?.username}</p>
          {profileData?.bio && <p className="orbit-bio">{profileData.bio}</p>}

          {/* Action Buttons */}
          {(profileData?.phone || profileData?.email) && (
            <div className="profile-action-buttons" style={{ '--action-color': orbitColor }}>
              {profileData?.phone && (
                <a href={`tel:${profileData.phone}`} className="profile-action-btn" title="Call">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </a>
              )}
              {profileData?.email && (
                <a href={`mailto:${profileData.email}`} className="profile-action-btn" title="Email">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </a>
              )}
              <button
                className="profile-action-btn"
                title="Share"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: profileData?.displayName || profileData?.username,
                      url: window.location.href
                    })
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                    alert('Link copied!')
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>
          )}
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

// ==========================================
// MODERN THEME - Split Layout with Cards
// ==========================================
const ModernLayout = ({ profileData, links, handleLinkClick }) => {
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Helper to get site name from URL
  const getSiteName = (url) => {
    try {
      const hostname = new URL(url).hostname
      return hostname.replace('www.', '').split('.')[0].charAt(0).toUpperCase() +
        hostname.replace('www.', '').split('.')[0].slice(1)
    } catch {
      return 'Link'
    }
  }

  // Helper to get favicon
  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    } catch {
      return null
    }
  }

  return (
    <div className={`modern-layout ${isDarkMode ? 'modern-dark' : 'modern-light'}`}>
      {/* Centered Container */}
      <div className="modern-container">
        {/* Left Panel - Profile Info */}
        <div className="modern-panel-left">
          {/* Theme Toggle Button (Moon/Sun) */}
          <button
            className="modern-theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            )}
          </button>

          {/* Avatar with Ring */}
          <div className="modern-avatar-wrapper">
            <div className="modern-avatar-ring"></div>
            <div className="modern-avatar">
              {profileData?.photoURL ? (
                <img src={profileData.photoURL} alt={profileData.displayName} />
              ) : (
                <span className="avatar-placeholder-public">
                  {profileData?.displayName?.charAt(0) || profileData?.username?.charAt(0) || '?'}
                </span>
              )}
            </div>
          </div>

          <h1 className="modern-name">
            {profileData?.displayName || profileData?.username}
            {(profileData?.plan === 'pro' || profileData?.plan === 'premium') && (
              <span className="verified-badge" title="Verified Pro">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#1D9BF0" />
                  <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </h1>

          {/* Action Buttons */}
          <div className="modern-action-buttons">
            {profileData?.phone && (
              <a href={`tel:${profileData.phone}`} className="modern-action-btn modern-action-btn-phone" title="Call">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>{profileData.phone}</span>
              </a>
            )}
            {profileData?.email && (
              <a href={`mailto:${profileData.email}`} className="modern-action-btn" title="Email">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </a>
            )}
            <button
              className="modern-action-btn"
              title="Share"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: profileData?.displayName || profileData?.username,
                    url: window.location.href
                  })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Link copied!')
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>

          {profileData?.bio && (
            <p className="modern-bio">{profileData.bio}</p>
          )}

          {/* Featured Link (first link) */}
          {links.length > 0 && (
            <a
              href={links[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="modern-featured-link"
              onClick={(e) => handleLinkClick(e, links[0])}
            >
              <div className="modern-featured-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div className="modern-featured-text">
                <span className="modern-featured-title">{links[0].title}</span>
                <span className="modern-featured-desc">Visit my personal website.</span>
              </div>
            </a>
          )}
        </div>

        {/* Right Panel - Links with scroll if 5+ */}
        <div className="modern-panel-right">
          <div className={`modern-links-container ${links.length > 5 ? 'has-scroll' : ''}`}>
            {links.slice(1).map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="modern-link-card"
                onClick={(e) => handleLinkClick(e, link)}
              >
                <div className="modern-link-icon">
                  <img
                    src={getFaviconUrl(link.url)}
                    alt=""
                    onError={(e) => e.target.style.opacity = '0'}
                  />
                </div>
                <div className="modern-link-content">
                  <h3 className="modern-link-title">{getSiteName(link.url)}</h3>
                  <p className="modern-link-desc">{link.title}</p>
                </div>
                <div className="modern-link-settings">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// BRAND THEME - Blended Photo + Card Grid
// ==========================================
const BrandLayout = ({ profileData, links, handleLinkClick }) => {
  // Get social-type links for icon row (detect common social platforms)
  const getSocialIcon = (url) => {
    try {
      const domain = new URL(url).hostname.toLowerCase()
      if (domain.includes('instagram')) return 'instagram'
      if (domain.includes('youtube')) return 'youtube'
      if (domain.includes('tiktok')) return 'tiktok'
      if (domain.includes('spotify')) return 'spotify'
      if (domain.includes('twitter') || domain.includes('x.com')) return 'twitter'
      if (domain.includes('facebook')) return 'facebook'
      if (domain.includes('linkedin')) return 'linkedin'
      if (domain.includes('pinterest')) return 'pinterest'
      if (domain.includes('whatsapp')) return 'whatsapp'
      return null
    } catch {
      return null
    }
  }

  // Separate social links from regular links
  const socialLinks = links.filter(link => getSocialIcon(link.url))
  const regularLinks = links.filter(link => !getSocialIcon(link.url))

  // Social icon SVGs
  const socialIcons = {
    instagram: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>,
    youtube: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>,
    tiktok: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>,
    spotify: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>,
    twitter: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
    facebook: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>,
    linkedin: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>,
    pinterest: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 0 0-4.373 23.178c-.07-.633-.134-1.606.028-2.298l1.157-4.907s-.295-.591-.295-1.465c0-1.373.796-2.398 1.787-2.398.842 0 1.249.633 1.249 1.39 0 .847-.538 2.115-.815 3.29-.232.979.492 1.776 1.459 1.776 1.752 0 3.099-1.847 3.099-4.513 0-2.36-1.697-4.012-4.12-4.012-2.807 0-4.455 2.105-4.455 4.283 0 .848.327 1.758.735 2.253a.296.296 0 0 1 .068.283c-.075.311-.242.979-.275 1.115-.043.18-.143.218-.33.131-1.233-.574-2.003-2.377-2.003-3.824 0-3.113 2.262-5.973 6.525-5.973 3.426 0 6.089 2.442 6.089 5.704 0 3.403-2.145 6.141-5.125 6.141-1.001 0-1.943-.52-2.265-1.134l-.615 2.347c-.223.859-.826 1.936-1.229 2.593a12 12 0 1 0 3.499-23.178z" /></svg>,
    whatsapp: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
  }

  return (
    <div className="brand-layout">
      {/* Blended Photo Background */}
      <div className="brand-photo-bg">
        {profileData?.photoURL && (
          <img src={profileData.photoURL} alt="" className="brand-photo-img" />
        )}
        <div className="brand-photo-overlay" />
      </div>

      {/* Main Content */}
      <div className="brand-content">
        {/* Brand Name / Display Name */}
        <h1 className="brand-name">
          {profileData?.displayName || profileData?.username}
          {(profileData?.plan === 'pro' || profileData?.plan === 'premium') && (
            <span className="verified-badge" title="Verified Pro">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#1D9BF0" />
                <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </h1>

        {/* Bio */}
        {profileData?.bio && <p className="brand-bio">{profileData.bio}</p>}

        {/* Social Icons Row */}
        {socialLinks.length > 0 && (
          <div className="brand-social-icons">
            {socialLinks.map((link) => {
              const iconType = getSocialIcon(link.url)
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brand-social-icon"
                  title={link.title}
                  onClick={(e) => handleLinkClick(e, link)}
                >
                  {socialIcons[iconType] || (
                    <img
                      src={getFaviconUrl(link.url)}
                      alt={link.title}
                      onError={(e) => e.target.style.opacity = '0'}
                    />
                  )}
                </a>
              )
            })}
          </div>
        )}

        {/* Link Cards Grid */}
        <div className="brand-cards-grid">
          {regularLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="brand-card"
              onClick={(e) => handleLinkClick(e, link)}
            >
              <div className="brand-card-icon">
                <img
                  src={getFaviconUrl(link.url)}
                  alt=""
                  onError={(e) => e.target.style.opacity = '0'}
                />
              </div>
              <span className="brand-card-title">{link.title}</span>
            </a>
          ))}
        </div>

        {/* Action Buttons */}
        {(profileData?.phone || profileData?.email) && (
          <div className="brand-actions">
            {profileData?.phone && (
              <a href={`tel:${profileData.phone}`} className="brand-action-btn" title="Call">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>
            )}
            {profileData?.email && (
              <a href={`mailto:${profileData.email}`} className="brand-action-btn" title="Email">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </a>
            )}
            <button
              className="brand-action-btn"
              title="Share"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: profileData?.displayName || profileData?.username,
                    url: window.location.href
                  })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Link copied!')
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
