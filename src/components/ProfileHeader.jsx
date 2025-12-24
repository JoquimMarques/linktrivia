import './ProfileHeader.css'

const ProfileHeader = ({ user, isOwner = false }) => {
  const { displayName, username, bio, photoURL, plan } = user || {}

  return (
    <div className="profile-header">
      {/* Avatar */}
      <div className="profile-avatar">
        {photoURL ? (
          <img src={photoURL} alt={displayName} />
        ) : (
          <span className="avatar-placeholder">
            {displayName?.charAt(0) || username?.charAt(0) || '?'}
          </span>
        )}
        {plan === 'pro' && (
          <span className="pro-badge" title="Pro Member">✦</span>
        )}
        {plan === 'business' && (
          <span className="business-badge" title="Business Member">★</span>
        )}
      </div>

      {/* Info */}
      <div className="profile-info">
        <h1 className="profile-name">{displayName || username}</h1>
        <p className="profile-username">@{username}</p>
        {bio && <p className="profile-bio">{bio}</p>}
      </div>

      {/* Owner Actions */}
      {isOwner && (
        <div className="profile-actions">
          <button className="btn btn-secondary btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Profile
          </button>
          <button className="btn btn-ghost btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share
          </button>
        </div>
      )}
    </div>
  )
}

export default ProfileHeader
