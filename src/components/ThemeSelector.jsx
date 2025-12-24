import { getPlanFeatures } from '../services/payments'
import './ThemeSelector.css'

const themes = [
  {
    id: 'default',
    name: 'Classic (Dark)',
    description: 'Minimalist Dark',
    color: '#0ea5e9',
    bgPreview: 'linear-gradient(180deg, #0a0a0b 0%, #1a1a1d 100%)'
  },
  {
    id: 'classic-light',
    name: 'Classic (Light)',
    description: 'Minimalist Light',
    color: '#cbd5e1',
    bgPreview: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)'
  },
  {
    id: 'elegante',
    name: 'Elegant',
    description: 'Light with gold',
    color: '#c9a227',
    bgPreview: 'linear-gradient(180deg, #f5f0e8 0%, #ebe5d8 50%, #e8e0d0 100%)'
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Dark with animations',
    color: '#00d4ff',
    bgPreview: 'linear-gradient(135deg, #0a192f 0%, #112240 50%, #1a365d 100%)',
    isPro: false
  },
  {
    id: 'gradient',
    name: 'Aurora',
    description: 'Vibrant gradient',
    color: '#a855f7',
    bgPreview: 'linear-gradient(135deg, #4c1d95 0%, #a855f7 40%, #db2777 100%)'
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Futuristic style',
    color: '#8b5cf6',
    bgPreview: 'linear-gradient(180deg, #0f0f1a 0%, #1a0a2e 100%)',
    isPro: false
  },

  // 🔹 NOVO MODELO — Portfólio com imagens organizadas
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Organized image grid',
    color: '#22c55e',
    bgPreview: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
    layout: 'portfolio',
    isPro: false
  },

  // 🔹 NOVO MODELO — Imagem central com links a girar
  {
    id: 'orbit',
    name: 'Orbit',
    description: 'Links rotating around image',
    color: '#f97316',
    bgPreview: 'radial-gradient(circle at center, #1f2937 0%, #020617 70%)',
    layout: 'orbit',
    isPro: false
  }
]

const ThemeSelector = ({ currentTheme, onSelectTheme, userPlan }) => {
  const planFeatures = getPlanFeatures(userPlan || 'free')
  const canUseCustomThemes = planFeatures.limits.customThemes

  const handleSelectTheme = (theme) => {
    if (theme.isPro && !canUseCustomThemes) {
      alert('This theme is exclusive to Pro and Premium users! Upgrade to unlock.')
      return
    }
    onSelectTheme(theme.id)
  }

  return (
    <div className="theme-selector-simple">
      <h3>Appearance</h3>
      <p className="theme-selector-desc">Choose your page style</p>

      <div className="theme-buttons">
        {themes.map((theme) => (
          <button
            key={theme.id}
            className={`theme-btn ${currentTheme === theme.id ? 'active' : ''} ${theme.isPro && !canUseCustomThemes ? 'locked' : ''}`}
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
            {theme.isPro && <span className="theme-pro-tag">PRO</span>}
            {currentTheme === theme.id && (
              <svg className="theme-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// export { themes }
export default ThemeSelector
