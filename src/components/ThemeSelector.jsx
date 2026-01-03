import { getPlanFeatures } from '../services/payments'
import './ThemeSelector.css'

const themes = [
  // FREE THEMES
  {
    id: 'default',
    name: 'Classic',
    description: 'Customizable accent color',
    color: '#8b8a8aff',
    bgPreview: 'linear-gradient(180deg, #0a0a0b 0%, #1a1a1d 100%)',
    tier: 'free'
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Futuristic style',
    color: '#8b5cf6',
    bgPreview: 'linear-gradient(180deg, #0f0f1a 0%, #1a0a2e 100%)',
    tier: 'free'
  },
  {
    id: 'glass',
    name: 'Glass',
    description: 'Custom background + blur',
    color: '#767676ff',
    bgPreview: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(100,100,100,0.2) 100%)',
    tier: 'basic'
  },
  {
    id: 'brand',
    name: 'Brand',
    description: 'Blended photo + card grid',
    color: '#a3c639',
    bgPreview: 'linear-gradient(135deg, #c5d86d 0%, #8fb339 100%)',
    tier: 'pro'
  },

  // BASIC THEMES
  {
    id: 'elegante',
    name: 'Elegant',
    description: 'Light with gold',
    color: '#c9a227',
    bgPreview: 'linear-gradient(180deg, #f5f0e8 0%, #ebe5d8 50%, #e8e0d0 100%)',
    tier: 'basic'
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Dark with animations',
    color: '#00d4ff',
    bgPreview: 'linear-gradient(135deg, #0a192f 0%, #112240 50%, #1a365d 100%)',
    tier: 'basic'
  },
  {
    id: 'gradient',
    name: 'Aurora',
    description: 'Vibrant gradient',
    color: '#a855f7',
    bgPreview: 'linear-gradient(135deg, #4c1d95 0%, #a855f7 40%, #db2777 100%)',
    tier: 'basic'
  },

  // PRO/PREMIUM THEMES
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Organized image grid',
    color: '#068d37ff',
    bgPreview: 'linear-gradient(135deg, #067022ff 0%, #013508ff 10%)',
    layout: 'portfolio',
    tier: 'pro'
  },
  {
    id: 'orbit',
    name: 'Orbit',
    description: 'Links rotating around image',
    color: '#f97316',
    bgPreview: 'radial-gradient(circle at center, #7a6128ff 0%, #311f01ff 70%)',
    layout: 'orbit',
    tier: 'pro'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Split layout with cards',
    color: '#6366f1',
    bgPreview: 'linear-gradient(135deg, #0f0f23 0%, #0d0d54ff 50%, #182750ff 100%)',
    layout: 'modern',
    tier: 'pro'
  }
]

const ThemeSelector = ({ currentTheme, onSelectTheme, userPlan }) => {
  // Plan hierarchy: free < basic < pro < premium
  const planHierarchy = { free: 0, basic: 1, pro: 2, premium: 3 }
  const userPlanLevel = planHierarchy[userPlan || 'free'] || 0

  // Check if user can use a theme based on tier
  const canUseTheme = (themeTier) => {
    const themeTierLevel = planHierarchy[themeTier] || 0
    return userPlanLevel >= themeTierLevel
  }

  // Get badge text for tier
  const getTierBadge = (tier) => {
    if (tier === 'basic') return 'BASIC'
    if (tier === 'pro') return 'PRO'
    return null
  }

  const handleSelectTheme = (theme) => {
    if (!canUseTheme(theme.tier)) {
      const tierName = theme.tier === 'basic' ? 'Basic' : 'Pro'
      alert(`This theme requires ${tierName} plan or higher! Upgrade to unlock.`)
      return
    }
    onSelectTheme(theme.id)
  }

  return (
    <div className="theme-selector-simple">
      <h3>Appearance</h3>
      <p className="theme-selector-desc">Choose your page style</p>

      <div className="theme-buttons">
        {themes.map((theme) => {
          const isLocked = !canUseTheme(theme.tier)
          const badge = getTierBadge(theme.tier)

          return (
            <button
              key={theme.id}
              className={`theme-btn ${currentTheme === theme.id ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => handleSelectTheme(theme)}
              style={{
                '--theme-color': theme.color,
                '--theme-bg': theme.bgPreview
              }}
            >
              <span className="theme-color-dot" style={{ background: theme.bgPreview }}></span>
              <div className="theme-btn-info">
                <span className="theme-btn-name">{theme.name}</span>
                <span className="theme-btn-desc">{theme.description}</span>
              </div>
              {badge && <span className={`theme-tier-tag tier-${theme.tier}`}>{badge}</span>}
              {currentTheme === theme.id && (
                <svg className="theme-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// export { themes }
export default ThemeSelector
