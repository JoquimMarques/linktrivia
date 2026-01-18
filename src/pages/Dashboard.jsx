import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../services/firebase'
import { getPlanFeatures, PLANS, calculateExpiryDate } from '../services/payments'
import { updateUsername, checkUsernameAvailability } from '../services/auth'
import ThemeSelector from '../components/ThemeSelector'
import QRCodeCustom from '../components/QRCodeCustom'
import './Dashboard.css'

// Helper to get favicon URL
const getFaviconUrl = (url) => {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return null
  }
}

const Dashboard = () => {
  const { user, userData, refreshUserData } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [links, setLinks] = useState([])
  const [editingLink, setEditingLink] = useState(null)
  const [newLink, setNewLink] = useState({ title: '', url: '' })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrType, setQrType] = useState('custom') // 'standard' or 'custom'
  const [showShareModal, setShowShareModal] = useState(false)

  // Profile editing states
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const [theme, setTheme] = useState('default')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [portfolioPhotos, setPortfolioPhotos] = useState([])
  const [portfolioColor, setPortfolioColor] = useState('#8b5cf6')
  const [orbitColor, setOrbitColor] = useState('#8b5cf6')
  const [classicColor, setClassicColor] = useState('#0ea5e9')
  const [glassBackground, setGlassBackground] = useState('')
  const [uploadingGlassBackground, setUploadingGlassBackground] = useState(false)
  const [uploadingPortfolioPhoto, setUploadingPortfolioPhoto] = useState(false)

  // Utility to compress image and convert to Base64
  const compressAndToBase64 = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const base64String = canvas.toDataURL('image/jpeg', quality)
          resolve(base64String)
        }
        img.onerror = (err) => reject(err)
      }
      reader.onerror = (err) => reject(err)
    })
  }

  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileChanged, setProfileChanged] = useState(false)

  // Username editing states
  const [username, setUsername] = useState('')
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [savingUsername, setSavingUsername] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState('links')

  // Upgrade success notification
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false)


  const fileInputRef = useRef(null)
  const portfolioInputRef = useRef(null)
  const planFeatures = getPlanFeatures(userData?.plan || 'free')

  // Check for upgrade success from Stripe redirect
  useEffect(() => {
    const upgradedPlan = searchParams.get('upgraded')
    const sessionId = searchParams.get('session_id')

    const processUpgrade = async () => {
      if (upgradedPlan && ['basic', 'pro', 'premium'].includes(upgradedPlan)) {
        // Update user plan in Firestore
        try {
          const expiryDate = calculateExpiryDate(upgradedPlan)
          await updateDoc(doc(db, 'users', user.uid), {
            plan: upgradedPlan,
            planUpdatedAt: serverTimestamp(),
            planExpiryDate: expiryDate ? expiryDate : null
          })
          console.log(`Plan updated to: ${upgradedPlan} (Expiry: ${expiryDate})`)
        } catch (error) {
          console.error('Error updating plan:', error)
        }

        // Show success notification
        setShowUpgradeSuccess(true)
        // Refresh user data to get updated plan
        await refreshUserData()
        // Remove query params
        setSearchParams({})
        // Hide notification after 5 seconds
        setTimeout(() => setShowUpgradeSuccess(false), 5000)
      } else if (upgradedPlan === 'true' || sessionId) {
        // Legacy support
        setShowUpgradeSuccess(true)
        refreshUserData()
        setSearchParams({})
        setTimeout(() => setShowUpgradeSuccess(false), 5000)
      }
    }

    if (user?.uid) {
      processUpgrade()
    }
  }, [searchParams, setSearchParams, refreshUserData, user])

  useEffect(() => {
    if (userData) {
      setLinks(userData.links || [])
      setDisplayName(userData.displayName || '')
      setBio(userData.bio || '')
      setPhotoURL(userData.photoURL || '')
      setTheme(userData.theme || 'default')
      setPhone(userData.phone || '')
      setEmail(userData.email || '')
      setPortfolioPhotos(userData.portfolioPhotos || [])
      setPortfolioColor(userData.portfolioColor || '#8b5cf6')
      setOrbitColor(userData.orbitColor || '#8b5cf6')
      setClassicColor(userData.classicColor || '#0ea5e9')
      setGlassBackground(userData.glassBackground || '')
      setUsername(userData.username || '')
    }
  }, [userData])

  // Check if profile has changed
  useEffect(() => {
    if (userData) {
      const hasChanged =
        displayName !== (userData.displayName || '') ||
        bio !== (userData.bio || '') ||
        photoURL !== (userData.photoURL || '') ||
        theme !== (userData.theme || 'default') ||
        phone !== (userData.phone || '') ||
        email !== (userData.email || '')
      setProfileChanged(hasChanged)
    }
  }, [displayName, bio, photoURL, theme, phone, email, userData])

  const saveLinks = async (updatedLinks) => {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        links: updatedLinks,
        updatedAt: serverTimestamp()
      })
      await refreshUserData()
    } catch (error) {
      console.error('Error saving links:', error)
    }
    setSaving(false)
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        bio,
        photoURL,
        theme,
        phone,
        email,
        updatedAt: serverTimestamp()
      })
      await refreshUserData()
      setProfileChanged(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    }
    setSavingProfile(false)
  }

  const handleThemeSelect = async (themeId) => {
    setTheme(themeId)
    // Auto-save theme
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        theme: themeId,
        updatedAt: serverTimestamp()
      })
      await refreshUserData()
    } catch (error) {
      console.error('Error saving theme:', error)
    }
  }

  const handlePortfolioColorChange = async (color) => {
    setPortfolioColor(color)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        portfolioColor: color,
        updatedAt: serverTimestamp()
      })
      await refreshUserData()
    } catch (error) {
      console.error('Error saving Portfolio color:', error)
    }
  }

  const handleOrbitColorChange = async (color) => {
    setOrbitColor(color)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        orbitColor: color,
        updatedAt: serverTimestamp()
      })
      await refreshUserData()
    } catch (error) {
      console.error('Error saving Orbit color:', error)
    }
  }

  const handleClassicColorChange = async (color) => {
    setClassicColor(color)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        classicColor: color,
        updatedAt: serverTimestamp()
      })
      await refreshUserData()
    } catch (error) {
      console.error('Error saving Classic color:', error)
    }
  }

  const handleGlassBackgroundUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('The image must be at most 10MB')
      return
    }

    setUploadingGlassBackground(true)
    try {
      // Higher resolution for background (1920x1080)
      const base64 = await compressAndToBase64(file, 1920, 1080, 0.8)
      setGlassBackground(base64)

      await updateDoc(doc(db, 'users', user.uid), {
        glassBackground: base64,
        updatedAt: serverTimestamp()
      })
      await refreshUserData()
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Error processing image')
    }
    setUploadingGlassBackground(false)
  }

  const handleRemoveGlassBackground = async () => {
    setGlassBackground('')
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        glassBackground: '',
        updatedAt: serverTimestamp()
      })
      await refreshUserData()
    } catch (error) {
      console.error('Error removing background:', error)
    }
  }

  // Check if user can change username based on plan limits
  const canChangeUsername = () => {
    const limit = planFeatures.limits.usernameChangesLimit || 2

    // Unlimited for Pro and Premium
    if (limit === Infinity) {
      return { allowed: true, remaining: Infinity }
    }

    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`
    const usernameChanges = userData?.usernameChanges || {}
    const monthlyChanges = usernameChanges[currentMonth] || 0
    const remaining = limit - monthlyChanges

    return { allowed: remaining > 0, remaining: Math.max(0, remaining) }
  }

  // Username editing handlers
  const handleEditUsername = () => {
    const { allowed, remaining } = canChangeUsername()
    const limit = planFeatures.limits.usernameChangesLimit || 2
    if (!allowed) {
      setUsernameError(`You've reached the limit of ${limit} username changes this month. Upgrade for more.`)
      return
    }
    setNewUsername(username)
    setEditingUsername(true)
    setUsernameError('')
    setUsernameAvailable(null)
  }

  const handleCancelUsernameEdit = () => {
    setEditingUsername(false)
    setNewUsername('')
    setUsernameError('')
    setUsernameAvailable(null)
  }

  const handleUsernameChange = async (value) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setNewUsername(normalized)
    setUsernameError('')
    setUsernameAvailable(null)

    if (normalized.length < 3) {
      setUsernameError('Minimum 3 characters')
      return
    }
    if (normalized.length > 20) {
      setUsernameError('Maximum 20 characters')
      return
    }
    if (normalized === username) {
      setUsernameAvailable(true)
      return
    }

    // Check availability with debounce
    setCheckingUsername(true)
    const available = await checkUsernameAvailability(normalized)
    setCheckingUsername(false)
    setUsernameAvailable(available)
    if (!available) {
      setUsernameError('Username already in use')
    }
  }

  const handleSaveUsername = async () => {
    if (!usernameAvailable || newUsername.length < 3) return

    // Check limit again before saving
    const { allowed } = canChangeUsername()
    const limit = planFeatures.limits.usernameChangesLimit || 2
    if (!allowed) {
      setUsernameError(`Monthly limit of ${limit} reached. Upgrade your plan for more.`)
      return
    }

    setSavingUsername(true)
    const { success, error } = await updateUsername(user.uid, username, newUsername)

    if (success) {
      // Track username change for plans with limits (not unlimited)
      if (limit !== Infinity) {
        const now = new Date()
        const currentMonth = `${now.getFullYear()}-${now.getMonth()}`
        const usernameChanges = userData?.usernameChanges || {}
        const monthlyChanges = usernameChanges[currentMonth] || 0

        await updateDoc(doc(db, 'users', user.uid), {
          usernameChanges: {
            ...usernameChanges,
            [currentMonth]: monthlyChanges + 1
          }
        })
      }
      await refreshUserData()
      setEditingUsername(false)
      setNewUsername('')
    } else {
      setUsernameError(error || 'Error updating username')
    }
    setSavingUsername(false)
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('The image must be at most 5MB')
      return
    }

    setUploadingPhoto(true)
    try {
      const base64 = await compressAndToBase64(file, 400, 400, 0.6)
      setPhotoURL(base64)

      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: base64,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Error processing image')
    }
    setUploadingPhoto(false)
  }

  const handlePortfolioPhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (portfolioPhotos.length >= 4) {
      alert('Maximum of 4 photos allowed')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('The image must be at most 5MB')
      return
    }

    setUploadingPortfolioPhoto(true)
    try {
      const base64 = await compressAndToBase64(file, 800, 800, 0.7)
      const newPhotos = [...portfolioPhotos, base64]
      setPortfolioPhotos(newPhotos)

      // Auto-save
      await updateDoc(doc(db, 'users', user.uid), {
        portfolioPhotos: newPhotos,
        updatedAt: serverTimestamp()
      })
      await refreshUserData()

    } catch (error) {
      console.error('Error processing image:', error)
      alert('Error processing image')
    }
    setUploadingPortfolioPhoto(false)
  }

  const handleRemovePortfolioPhoto = async (index) => {
    const newPhotos = [...portfolioPhotos]
    newPhotos.splice(index, 1)
    setPortfolioPhotos(newPhotos)

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        portfolioPhotos: newPhotos,
        updatedAt: serverTimestamp()
      })
      await refreshUserData()
    } catch (error) {
      console.error('Error removing photo:', error)
    }
  }

  const handleAddLink = async () => {
    if (!newLink.title || !newLink.url) return

    // Calculate total allowed links (plan limit + extra links purchased with coins)
    const extraLinks = userData?.extraLinks || 0
    const totalAllowedLinks = planFeatures.limits.maxLinks === Infinity
      ? Infinity
      : planFeatures.limits.maxLinks + extraLinks

    if (links.length >= totalAllowedLinks) {
      const message = extraLinks > 0
        ? `You have reached the maximum of ${totalAllowedLinks} links (${planFeatures.limits.maxLinks} from plan + ${extraLinks} purchased). Buy more link slots in the Store!`
        : `You have reached the maximum of ${planFeatures.limits.maxLinks} links for your plan. Upgrade to Basic for unlimited links or buy extra slots in the Store!`
      alert(message)
      return
    }

    const url = newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`

    const link = {
      id: Date.now().toString(),
      title: newLink.title,
      url: url,
      favicon: getFaviconUrl(url),
      createdAt: new Date().toISOString()
    }

    const updatedLinks = [...links, link]
    setLinks(updatedLinks)
    setNewLink({ title: '', url: '' })
    await saveLinks(updatedLinks)
  }

  const handleDeleteLink = async (linkId) => {
    const updatedLinks = links.filter(l => l.id !== linkId)
    setLinks(updatedLinks)
    await saveLinks(updatedLinks)
  }

  const handleEditLink = async (linkId, updates) => {
    const url = updates.url.startsWith('http') ? updates.url : `https://${updates.url}`
    const updatedLinks = links.map(l =>
      l.id === linkId ? {
        ...l,
        ...updates,
        url,
        favicon: getFaviconUrl(url)
      } : l
    )
    setLinks(updatedLinks)
    setEditingLink(null)
    await saveLinks(updatedLinks)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${userData?.username}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Social sharing functions
  const getShareUrl = () => `${window.location.origin}/${userData?.username}`
  const getShareText = () => `Check out my Orbilink page! 🔗`

  const shareToSocial = (platform) => {
    const url = encodeURIComponent(getShareUrl())
    const text = encodeURIComponent(getShareText())

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      email: `mailto:?subject=${encodeURIComponent('Check out my Orbilink page!')}&body=${text}%20${url}`
    }

    if (platform === 'email') {
      window.location.href = shareUrls[platform]
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400')
    }
    setShowShareModal(false)
  }

  const moveLink = async (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= links.length) return

    const updatedLinks = [...links]
    const [removed] = updatedLinks.splice(index, 1)
    updatedLinks.splice(newIndex, 0, removed)

    setLinks(updatedLinks)
    await saveLinks(updatedLinks)
  }

  const downloadQRCode = (format) => {
    const svg = document.getElementById('dashboard-qrcode')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    if (format === 'svg') {
      const link = document.createElement('a')
      link.href = url
      link.download = `qrcode-${userData?.username}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      img.onload = () => {
        // High quality download
        const size = 1024
        canvas.width = size
        canvas.height = size
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, size, size)
        ctx.drawImage(img, 0, 0, size, size)
        const pngUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = pngUrl
        link.download = `qrcode-${userData?.username}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
      img.src = url
    }
  }

  // Aurora layout: 2 links = 1 main + 1 icon, mais de 2 = resto main + últimos 4 icons
  const getAuroraLayout = () => {
    if (links.length === 0) return { mainLinks: [], iconLinks: [] }
    if (links.length === 1) return { mainLinks: links, iconLinks: [] }
    if (links.length === 2) return { mainLinks: [links[0]], iconLinks: [links[1]] }
    const iconCount = Math.min(4, links.length - 1)
    const mainLinks = links.slice(0, links.length - iconCount)
    const iconLinks = links.slice(-iconCount)
    return { mainLinks: mainLinks.slice(0, 3), iconLinks }
  }

  // Render preview based on theme
  const renderPreviewLinks = () => {
    // Aurora, Elegante e Tech: Links principais em cima + ícones embaixo
    if (theme === 'gradient' || theme === 'elegante' || theme === 'tech') {
      const { mainLinks, iconLinks } = getAuroraLayout()
      return (
        <>
          {mainLinks.length > 0 && (
            <div className={`preview-main-links ${theme === 'elegante' ? 'elegante' : ''}`}>
              {mainLinks.map((link) => (
                <div key={link.id} className="preview-link">
                  <img
                    src={getFaviconUrl(link.url)}
                    alt=""
                    className="preview-link-favicon"
                    onError={(e) => e.target.style.opacity = '0'}
                  />
                  <span>{link.title}</span>
                </div>
              ))}
            </div>
          )}
          {iconLinks.length > 0 && (
            <div className="preview-icon-links">
              {iconLinks.map((link) => (
                <div key={link.id} className="preview-icon-link">
                  <img
                    src={getFaviconUrl(link.url)}
                    alt={link.title}
                    onError={(e) => e.target.style.opacity = '0'}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )
    }

    // PORTFÓLIO: Grid Layout na Preview
    if (theme === 'portfolio') {
      const displayLinks = links.slice(0, 4)
      return (
        <div className="preview-portfolio-grid">
          {/* Left: Links */}
          <div className="preview-portfolio-links">
            {displayLinks.map((link) => (
              <div key={link.id} className="preview-link">
                <img src={getFaviconUrl(link.url)} className="preview-link-favicon" alt="" />
              </div>
            ))}
          </div>

          {/* Right: Carousel Mock */}
          <div className="preview-portfolio-carousel">
            {portfolioPhotos.length > 0 ? (
              <img src={portfolioPhotos[0]} alt="Carousel" />
            ) : (
              <div className="carousel-placeholder" />
            )}
          </div>
        </div>
      )
    }

    // ORBIT: Radial Layout na Preview
    if (theme === 'orbit') {
      const orbitLinks = links.slice(0, 6)
      return (
        <div className="preview-orbit-container" style={{ '--orbit-color': orbitColor }}>
          <div className="preview-orbit-ring">
            {orbitLinks.map((link, i) => (
              <div
                key={link.id}
                className="preview-orbit-item"
                style={{ '--i': i, '--total': orbitLinks.length }}
              >
                <img src={getFaviconUrl(link.url)} alt="" />
              </div>
            ))}
          </div>
          {/* Centered Avatar is handled by parent container, but we might need spacing */}
        </div>
      )
    }

    // MODERN: Split Layout Preview
    if (theme === 'modern') {
      const displayLinks = links.slice(0, 3)
      return (
        <div className="preview-modern-layout">
          <div className="preview-modern-left">
            <div className="preview-modern-toggle">🌙</div>
            <div className="preview-modern-avatar-ring">
              {photoURL ? (
                <img src={photoURL} alt="Preview" />
              ) : (
                <span>{displayName?.charAt(0) || '?'}</span>
              )}
            </div>
            <div className="preview-modern-name">{displayName || 'Name'}</div>
            <div className="preview-modern-actions">
              {phone && <span className="preview-modern-btn">📞</span>}
              {email && <span className="preview-modern-btn">✉️</span>}
              <span className="preview-modern-btn">📤</span>
            </div>
          </div>
          <div className="preview-modern-right">
            {displayLinks.map((link) => (
              <div key={link.id} className="preview-modern-card">
                <img src={getFaviconUrl(link.url)} alt="" />
                <span>{link.title}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Clássico e Neon: Lista normal
    const displayLinks = links.slice(0, 4)
    return (
      <div className="preview-main-links">
        {displayLinks.map((link) => (
          <div key={link.id} className="preview-link">
            <img
              src={getFaviconUrl(link.url)}
              alt=""
              className="preview-link-favicon"
              onError={(e) => e.target.style.opacity = '0'}
            />
            <span>{link.title}</span>
          </div>
        ))}
        {links.length > 4 && (
          <div className="preview-more">+{links.length - 4} more</div>
        )}
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Upgrade Success Notification */}
      {showUpgradeSuccess && (
        <div className="upgrade-success-banner">
          <div className="upgrade-success-content">
            <span className="upgrade-success-icon">🎉</span>
            <div>
              <strong>Congratulations! Your plan has been activated!</strong>
              <p>You now have access to {PLANS[userData?.plan]?.name || 'Pro'}. Enjoy all the features!</p>
            </div>
            <button
              className="upgrade-success-close"
              onClick={() => setShowUpgradeSuccess(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Share Your Page</h3>
              <button className="share-modal-close" onClick={() => setShowShareModal(false)}>
                ✕
              </button>
            </div>
            <div className="share-modal-content">
              <p className="share-modal-url">{window.location.origin}/{userData?.username}</p>
              <div className="share-buttons">
                <button className="share-btn facebook" onClick={() => shareToSocial('facebook')}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                  <span>Facebook</span>
                </button>
                <button className="share-btn twitter" onClick={() => shareToSocial('twitter')}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>X / Twitter</span>
                </button>
                <button className="share-btn whatsapp" onClick={() => shareToSocial('whatsapp')}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span>WhatsApp</span>
                </button>
                <button className="share-btn linkedin" onClick={() => shareToSocial('linkedin')}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span>LinkedIn</span>
                </button>
                <button className="share-btn telegram" onClick={() => shareToSocial('telegram')}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  <span>Telegram</span>
                </button>
                <button className="share-btn email" onClick={() => shareToSocial('email')}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span>Email</span>
                </button>
              </div>
              <div className="share-copy-section">
                <input
                  type="text"
                  value={`${window.location.origin}/${userData?.username}`}
                  readOnly
                  className="share-url-input"
                />
                <button className="btn btn-primary" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/${userData?.username}`)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-info">
            <h1>My Page</h1>
            <p>Customize your profile and manage your links</p>
            {userData?.plan && userData.plan !== 'free' && (
              <span className="plan-badge">
                ✨ {PLANS[userData.plan]?.name}
              </span>
            )}
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={handleCopyLink}>
              {copied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy Link
                </>
              )}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowShareModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>
            <Link to={`/${userData?.username}`} className="btn btn-primary" target="_blank">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View My Page
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'links' ? 'active' : ''}`}
            onClick={() => setActiveTab('links')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Links
          </button>
          <button
            className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            Appearance
          </button>
          <button
            className={`tab-btn ${activeTab === 'qrcode' ? 'active' : ''}`}
            onClick={() => setActiveTab('qrcode')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="3" height="3" />
              <rect x="18" y="14" width="3" height="3" />
              <rect x="14" y="18" width="3" height="3" />
              <rect x="18" y="18" width="3" height="3" />
            </svg>
            QR Code
          </button>
        </div>

        <div className="dashboard-content">
          {/* Main Content */}
          <div className="dashboard-main">
            {activeTab === 'links' && (
              <>
                {/* Profile Edit Section */}
                <div className="profile-edit-card card">
                  <h3>Profile</h3>

                  <div className="profile-edit-content">
                    {/* Photo Upload */}
                    <div className="photo-upload-section">
                      <div
                        className="photo-preview"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploadingPhoto ? (
                          <div className="photo-loading">
                            <div className="loading-spinner-small"></div>
                          </div>
                        ) : photoURL ? (
                          <img src={photoURL} alt="Profile photo" />
                        ) : (
                          <span className="photo-placeholder">
                            {displayName?.charAt(0) || userData?.username?.charAt(0) || '?'}
                          </span>
                        )}
                        <div className="photo-overlay">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto ? 'Uploading...' : 'Change photo'}
                      </button>
                    </div>

                    {/* Profile Fields */}
                    <div className="profile-fields">
                      {/* Username Field */}
                      <div className="input-group">
                        <label className="input-label">Username</label>
                        {editingUsername ? (
                          <div className="username-edit">
                            <div className="username-input-wrapper">
                              <span className="username-prefix">@</span>
                              <input
                                type="text"
                                className={`input username-input ${usernameError ? 'error' : ''} ${usernameAvailable === true ? 'success' : ''}`}
                                placeholder="your_username"
                                value={newUsername}
                                onChange={(e) => handleUsernameChange(e.target.value)}
                                maxLength={20}
                                autoFocus
                              />
                              {checkingUsername && (
                                <span className="username-status checking">⏳</span>
                              )}
                              {!checkingUsername && usernameAvailable === true && (
                                <span className="username-status available">✓</span>
                              )}
                              {!checkingUsername && usernameAvailable === false && (
                                <span className="username-status unavailable">✗</span>
                              )}
                            </div>
                            {usernameError && (
                              <span className="username-error">{usernameError}</span>
                            )}
                            <div className="username-actions">
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={handleSaveUsername}
                                disabled={!usernameAvailable || savingUsername || newUsername.length < 3}
                              >
                                {savingUsername ? 'Salvando...' : 'Salvar'}
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={handleCancelUsernameEdit}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="username-display">
                            <span className="username-value">@{username}</span>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={handleEditUsername}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                        <span className="input-hint">
                          orbil.ink/{username}
                          {(planFeatures.limits.usernameChangesLimit !== Infinity) && (
                            <span className="username-limit-hint">
                              {' • '}{canChangeUsername().remaining} change{canChangeUsername().remaining !== 1 ? 's' : ''} remaining this month
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="input-group">
                        <label className="input-label">Name</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Your name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          maxLength={50}
                        />
                      </div>

                      <div className="input-group">
                        <label className="input-label">Bio</label>
                        <textarea
                          className="input textarea"
                          placeholder="Tell us a bit about yourself..."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          maxLength={150}
                          rows={3}
                        />
                        <span className="char-count">{bio.length}/150</span>
                      </div>

                      {/* Contact Info for Action Buttons */}
                      <div className="contact-fields">
                        <div className="input-group input-half">
                          <label className="input-label">📞 Phone (optional)</label>
                          <input
                            type="tel"
                            className="input"
                            placeholder="+351 912 345 678"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                        <div className="input-group input-half">
                          <label className="input-label">✉️ Email (optional)</label>
                          <input
                            type="email"
                            className="input"
                            placeholder="contact@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <span className="input-hint">These will show as action buttons on some themes (Modern, etc.)</span>

                      {profileChanged && (
                        <button
                          className="btn btn-primary"
                          onClick={saveProfile}
                          disabled={savingProfile}
                        >
                          {savingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add Link Card */}
                <div className="add-link-card card">
                  <h3>Add Link</h3>
                  <div className="add-link-form">
                    <input
                      type="text"
                      className="input"
                      placeholder="Title (e.g., My Instagram)"
                      value={newLink.title}
                      onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    />
                    <input
                      type="url"
                      className="input"
                      placeholder="URL (e.g., https://instagram.com/your_profile)"
                      value={newLink.url}
                      onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleAddLink}
                      disabled={!newLink.title || !newLink.url || saving}
                    >
                      {saving ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                  <p className="link-count">
                    {links.length} / {planFeatures.limits.maxLinks === Infinity ? '∞' : planFeatures.limits.maxLinks} links
                  </p>
                </div>

                {/* Links List */}
                <div className="links-section">
                  <h3>My Links</h3>
                  <div className="links-list">
                    {links.length === 0 ? (
                      <div className="empty-state card">
                        <span className="empty-icon">🔗</span>
                        <h4>No links yet</h4>
                        <p>Add your first link above</p>
                      </div>
                    ) : (
                      links.map((link, index) => (
                        <div key={link.id} className="link-item card">
                          {editingLink === link.id ? (
                            <div className="link-edit">
                              <input
                                type="text"
                                className="input"
                                defaultValue={link.title}
                                id={`title-${link.id}`}
                              />
                              <input
                                type="url"
                                className="input"
                                defaultValue={link.url}
                                id={`url-${link.id}`}
                              />
                              <div className="link-edit-actions">
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleEditLink(link.id, {
                                    title: document.getElementById(`title-${link.id}`).value,
                                    url: document.getElementById(`url-${link.id}`).value
                                  })}
                                >
                                  Save
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setEditingLink(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="link-drag">
                                <button
                                  className="drag-btn"
                                  onClick={() => moveLink(index, -1)}
                                  disabled={index === 0}
                                >
                                  ↑
                                </button>
                                <button
                                  className="drag-btn"
                                  onClick={() => moveLink(index, 1)}
                                  disabled={index === links.length - 1}
                                >
                                  ↓
                                </button>
                              </div>
                              <div className="link-item-favicon">
                                <img
                                  src={getFaviconUrl(link.url)}
                                  alt=""
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              </div>
                              <div className="link-info">
                                <h4>{link.title}</h4>
                                <p>{link.url}</p>
                              </div>
                              <div className="link-actions">
                                <button
                                  className="icon-btn"
                                  onClick={() => setEditingLink(link.id)}
                                  title="Edit"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button
                                  className="icon-btn danger"
                                  onClick={() => handleDeleteLink(link.id)}
                                  title="Delete"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'appearance' && (
              <div className="appearance-section card">
                <ThemeSelector
                  currentTheme={theme}
                  onSelectTheme={handleThemeSelect}
                  userPlan={userData?.plan || 'free'}
                />

                {theme === 'portfolio' && (
                  <div className="portfolio-config">
                    <h4>Portfolio Photos (Max 4)</h4>
                    <div className="portfolio-photos-grid">
                      {portfolioPhotos.map((photo, index) => (
                        <div key={index} className="portfolio-photo-item">
                          <img src={photo} alt={`Portfolio ${index + 1}`} />
                          <button
                            className="remove-photo-btn"
                            onClick={() => handleRemovePortfolioPhoto(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      {portfolioPhotos.length < 4 && (
                        <div
                          className="add-portfolio-photo"
                          onClick={() => portfolioInputRef.current?.click()}
                        >
                          {uploadingPortfolioPhoto ? (
                            <div className="loading-spinner-small"></div>
                          ) : (
                            <span>+ Add</span>
                          )}
                        </div>
                      )}
                    </div>
                    <input
                      ref={portfolioInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePortfolioPhotoUpload}
                      style={{ display: 'none' }}
                    />

                    <div className="portfolio-color-config" style={{ marginTop: '20px' }}>
                      <h4>Portfolio Color</h4>
                      <p className="config-description">Choose the main color for buttons and details</p>
                      <div className="color-picker-container">
                        <input
                          type="color"
                          value={portfolioColor}
                          onChange={(e) => handlePortfolioColorChange(e.target.value)}
                          className="theme-color-picker"
                        />
                        <span className="color-hex-value">{portfolioColor}</span>
                      </div>
                    </div>
                  </div>
                )}

                {theme === 'orbit' && (
                  <div className="orbit-config">
                    <h4>Customize Orbit</h4>
                    <p className="config-description">Choose the main color for the Orbit animation</p>
                    <div className="color-picker-container">
                      <input
                        type="color"
                        value={orbitColor}
                        onChange={(e) => handleOrbitColorChange(e.target.value)}
                        className="theme-color-picker"
                      />
                      <span className="color-hex-value">{orbitColor}</span>
                    </div>
                  </div>
                )}

                {theme === 'glass' && (
                  <div className="glass-config">
                    <h4>Background Image</h4>
                    <p className="config-description">Upload a background image for your Glass theme</p>

                    <div className="glass-background-preview">
                      {glassBackground ? (
                        <div className="glass-bg-container">
                          <img src={glassBackground} alt="Glass Background" className="glass-bg-image" />
                          <button
                            className="remove-glass-bg-btn"
                            onClick={handleRemoveGlassBackground}
                          >
                            ✕ Remove
                          </button>
                        </div>
                      ) : (
                        <label className="glass-bg-upload">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleGlassBackgroundUpload}
                            style={{ display: 'none' }}
                          />
                          {uploadingGlassBackground ? (
                            <div className="loading-spinner-small"></div>
                          ) : (
                            <>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21,15 16,10 5,21" />
                              </svg>
                              <span>Upload Background</span>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                    <p className="config-hint">Tip: Use a high-resolution image for better results on all devices</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'qrcode' && (
              <div className="qrcode-section card">
                <h3>Your QR Code</h3>
                <p className="qrcode-description">
                  Scan this code to access your page or download it to share
                </p>

                {/* QR Code Toggle - Custom only for paid plans */}
                {(userData?.plan && userData.plan !== 'free') ? (
                  <div className="qrcode-type-toggle">
                    <button
                      className={`toggle-btn ${qrType === 'standard' ? 'active' : ''}`}
                      onClick={() => setQrType('standard')}
                    >
                      Standard
                    </button>
                    <button
                      className={`toggle-btn ${qrType === 'custom' ? 'active' : ''}`}
                      onClick={() => setQrType('custom')}
                    >
                      Customized
                    </button>
                  </div>
                ) : (
                  <div className="qrcode-free-notice">
                    <p>🔒 Custom QR Code is available on paid plans</p>
                    <Link to="/pricing" className="btn btn-ghost btn-sm">Upgrade Now</Link>
                  </div>
                )}

                <div className="qrcode-container">
                  <div className="qrcode-preview">
                    <QRCodeCustom
                      id="dashboard-qrcode"
                      value={`${window.location.origin}/${userData?.username}`}
                      size={200}
                      userPhoto={(userData?.plan && userData.plan !== 'free' && qrType === 'custom') ? userData?.photoURL : null}
                      primaryColor={(userData?.plan && userData.plan !== 'free' && qrType === 'custom') ? (userData?.portfolioColor || '#0ea5e9') : '#000000'}
                      qrType={(userData?.plan && userData.plan !== 'free') ? qrType : 'standard'}
                    />
                  </div>

                  <div className="qrcode-url">
                    <span>{window.location.origin}/{userData?.username}</span>
                  </div>
                </div>

                <div className="qrcode-actions">
                  <button
                    onClick={() => downloadQRCode('png')}
                    className="btn btn-primary"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PNG
                  </button>
                  <button
                    onClick={() => downloadQRCode('svg')}
                    className="btn btn-secondary"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download SVG
                  </button>
                </div>

                <div className="qrcode-tips">
                  <h4>💡 Usage tips</h4>
                  <ul>
                    <li>Print on business cards</li>
                    <li>Add to presentations</li>
                    <li>Place on products or packaging</li>
                    <li>Share on social networks</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Preview */}
          <div className="dashboard-sidebar">
            <div className="preview-card">
              <h3>Preview</h3>
              <div
                className={`preview-phone theme-${theme}`}
                style={
                  theme === 'orbit' ? { '--orbit-color': orbitColor } :
                    theme === 'portfolio' ? { '--portfolio-color': portfolioColor } :
                      theme === 'default' ? { '--classic-color': classicColor } :
                        {}
                }
              >
                <div className="preview-content">
                  {/* Modern theme has its own layout */}
                  {theme === 'modern' ? (
                    renderPreviewLinks()
                  ) : (
                    <>
                      {/* Avatar */}
                      <div className="preview-avatar">
                        {photoURL ? (
                          <img src={photoURL} alt="Preview" />
                        ) : (
                          <span>{displayName?.charAt(0) || '?'}</span>
                        )}
                      </div>

                      {/* Name */}
                      <h4 className="preview-name">{displayName || 'Your Name'}</h4>

                      {/* Username */}
                      <p className="preview-username">@{userData?.username}</p>

                      {/* Bio */}
                      {bio && <p className="preview-bio">{bio}</p>}

                      {/* Links */}
                      {renderPreviewLinks()}
                    </>
                  )}
                </div>
              </div>

              {/* Classic Theme Color Picker - below preview */}
              {theme === 'default' && (
                <div className="classic-config" style={{ marginTop: '16px' }}>
                  <h4>Customize Classic</h4>
                  <p className="config-description">Choose your accent color for buttons and highlights</p>
                  <div className="color-picker-container">
                    <input
                      type="color"
                      value={classicColor}
                      onChange={(e) => handleClassicColorChange(e.target.value)}
                      className="theme-color-picker"
                    />
                    <span className="color-hex-value">{classicColor}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Upgrade Card */}
            {userData?.plan === 'free' && (
              <div className="upgrade-card card">
                <span className="upgrade-icon">✨</span>
                <h3>Upgrade to Pro</h3>
                <p>Exclusive themes, advanced analytics, and much more!</p>
                <Link to="/pricing" className="btn btn-primary" style={{ width: '100%' }}>
                  View Plans
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
