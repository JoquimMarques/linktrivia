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
      icon: '🔗',
      title: 'One Link for Everything',
      description: 'Share all your important links with a single memorable URL'
    },
    {
      icon: '📊',
      title: 'Powerful Analytics',
      description: 'Track clicks, views, and engagement with detailed insights'
    },
    {
      icon: '🎨',
      title: 'Custom Themes',
      description: 'Make your page unique with beautiful and customizable themes'
    },
    {
      icon: '⚡',
      title: 'Super Fast',
      description: 'Optimized for speed with instant worldwide loading'
    },
    {
      icon: '🔒',
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% guaranteed uptime'
    },
    {
      icon: '📱',
      title: 'Mobile Optimized',
      description: 'Perfect experience on any device, anywhere'
    }
  ]

  const stats = [
    { value: '10M+', label: 'Links Created' },
    { value: '50M+', label: 'Monthly Clicks' },
    { value: '99.9%', label: 'Uptime' },
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
            <span className="badge-icon">✨</span>
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
            <p>Join thousands of creators, businesses, and influencers who trust LinkRole</p>
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
              <span className="logo-icon">⚡</span>
              <span className="logo-text text-gradient">LinkRole</span>
            </div>
            <p className="footer-copyright">
              © {new Date().getFullYear()} LinkRole. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
