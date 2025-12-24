import './LinkButton.css'

const LinkButton = ({ link, theme = 'default' }) => {
  const { title, url, icon, thumbnail } = link

  // Extract domain for favicon
  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    } catch {
      return null
    }
  }

  const faviconUrl = thumbnail || getFaviconUrl(url)

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <button 
      className={`link-button theme-${theme}`}
      onClick={handleClick}
    >
      {faviconUrl && (
        <div className="link-favicon">
          <img 
            src={faviconUrl} 
            alt="" 
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>
      )}
      
      {icon && !faviconUrl && (
        <span className="link-icon">{icon}</span>
      )}
      
      <span className="link-title">{title}</span>
      
      <svg 
        className="link-arrow" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        <path d="M7 17L17 7M17 7H7M17 7V17" />
      </svg>
    </button>
  )
}

export default LinkButton
