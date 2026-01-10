import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Home.css'

// Import showcase images
import model1 from '../assets/1.png'
import model2 from '../assets/2.png'
import model3 from '../assets/elegante-bg.png'



const Home = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  // Don't render Home if authenticated (will redirect)
  if (isAuthenticated) {
    return null
  }

  const features = [
    {
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#gradient1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><defs><linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
      title: 'One Link for Everything',
      description: 'Share all your important links with a single memorable URL'
    },
    {
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#gradient2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><defs><linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs><rect x="16" y="10" width="4" height="10" rx="1" fill="url(#gradient2)" /><rect x="10" y="4" width="4" height="16" rx="1" fill="url(#gradient2)" /><rect x="4" y="14" width="4" height="6" rx="1" fill="url(#gradient2)" /></svg>,
      title: 'Powerful Analytics',
      description: 'Track clicks, views, and engagement with detailed insights'
    },
    {
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#gradient3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><defs><linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" /></svg>,
      title: 'Custom Themes',
      description: 'Make your page unique with beautiful and customizable themes'
    },
    {
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#gradient4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><defs><linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
      title: 'Super Fast',
      description: 'Optimized for speed with instant worldwide loading'
    },
    {
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#gradient5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><defs><linearGradient id="gradient5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% guaranteed uptime'
    },
    {
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#gradient6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><defs><linearGradient id="gradient6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><circle cx="12" cy="18" r="1" fill="url(#gradient6)" /></svg>,
      title: 'Mobile Optimized',
      description: 'Perfect experience on any device, anywhere'
    }
  ]

  const stats = [
    { value: '1M+', label: 'Links Created' },
    { value: '50M+', label: 'Monthly Clicks' },
    { value: '92.4%', label: 'Uptime' },
    { value: '150+', label: 'Countries' }
  ]

  const showcaseModels = [
    {
      image: model1,
      name: 'Orbit',
      description: 'Clean and modern layout for professionals and growing businesses',
      category: 'Creative'
    },
    {
      image: model2,
      name: 'Tech',
      description: 'Designed for developers, creators, and digital portfolios',
      category: 'Personal'
    },
    {
      image: model3,
      name: 'Suave',
      description: 'Elegant and calm design for coaches, therapists, and mentors',
      category: 'Business'
    }
  ]


  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <svg className="badge-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="url(#badgeGradient)" strokeWidth="2"><defs><linearGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            <span>The link-in-bio platform for professionals</span>
          </div>

          <h1 className="hero-title">
            One Link to{' '}
            <span className="text-gradient">Rule Them All</span>
          </h1>

          <p className="hero-description">
            Create a beautiful and customizable page that gathers all your important links.
            Share your content, products, and social networks with a single link.
          </p>

          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started for Free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              I already have an account
            </Link>
          </div>

          <p className="hero-note">
            No credit card required • Free plan available forever
          </p>
        </div>

        {/* Hero Visual - Floating Models */}
        <div className="hero-visual">
          <div className="floating-models">
            <div className="model-phone model-left">
              <img src={model3} alt="Modelo Suave" />
            </div>
            <div className="model-phone model-center">
              <img src={model2} alt="Tech Model" />
            </div>
            <div className="model-phone model-right">
              <img src={model1} alt="Elegant Model" />
            </div>
          </div>
          <div className="hero-glow"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="showcase-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Templates</span>
            <h2>Amazing Models for You</h2>
            <p>Choose from dozens of professional templates and customize to your taste</p>
          </div>

          <div className="showcase-grid">
            {showcaseModels.map((model, index) => (
              <div
                key={index}
                className="showcase-card"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="showcase-image-wrapper">
                  <img src={model.image} alt={model.name} className="showcase-image" />
                  <div className="showcase-overlay">
                    <Link to="/register" className="btn btn-primary">
                      Use This Template
                    </Link>
                  </div>
                </div>
                <div className="showcase-info">
                  <span className="showcase-category">{model.category}</span>
                  <h3>{model.name}</h3>
                  <p>{model.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="showcase-cta">
            <Link to="/register" className="btn btn-secondary btn-lg">
              View All Templates
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2>Everything You Need</h2>
            <p>Powerful features to help you grow your online presence</p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2>Ready to Start?</h2>
            <p>Join thousands of creators, businesses, and influencers who trust Orbilink</p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Your Free Page
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="logo-text text-gradient">Orbilink</span>
            </div>
            <div className="footer-links">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
            <p className="footer-copyright">
              © {new Date().getFullYear()} Orbil.ink All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
