import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PLANS, redirectToPayment } from '../services/payments'
import QRCodeCustom from '../components/QRCodeCustom'
import './Pricing.css'

const Pricing = () => {
  const { isAuthenticated, user, userData } = useAuth()

  // Check for successful payment redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const status = urlParams.get('status')
    const txRef = urlParams.get('tx_ref')

    if (status === 'successful' || status === 'completed' || txRef) {
      // Show success message and redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard?upgraded=true'
      }, 1500)
    }
  }, [])

  const plans = [
    {
      ...PLANS.free,
      cta: 'Start for Free'
    },
    {
      ...PLANS.basic,
      cta: 'Subscribe Basic'
    },
    {
      ...PLANS.pro,
      cta: 'Subscribe Pro'
    },
    {
      ...PLANS.premium,
      cta: 'Subscribe Premium'
    }
  ]

  const faqs = [
    {
      question: 'Can I change plans at any time?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you will pay the proportional difference. When downgrading, your new plan will start at the end of the current billing cycle.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept credit/debit cards, bank transfers, mobile money, and other local methods through Flutterwave, our secure payment processor.'
    },
    {
      question: 'Is there a trial period?',
      answer: 'Our Free plan is free forever! You can also try out paid features with a 7-day money-back guarantee.'
    },
    {
      question: 'Can I cancel at any time?',
      answer: 'Absolutely. You can cancel your subscription at any time through your dashboard. Your access will continue until the end of the billing period.'
    },
    {
      question: 'How does billing work?',
      answer: 'Basic is billed weekly, Pro monthly, and Premium annually. All billings are automatic and you can cancel whenever you want.'
    },
    {
      question: 'Are payments secure?',
      answer: 'Yes! We use Flutterwave, one of the most secure payment platforms in Africa. Your payment data never passes through our servers.'
    }
  ]

  const isCurrentPlan = (planId) => userData?.plan === planId

  const handleSubscribe = (planId) => {
    if (planId === 'free') {
      window.location.href = '/register'
      return
    }

    if (!isAuthenticated) {
      window.location.href = '/register'
      return
    }

    redirectToPayment(planId, user?.email, user?.uid)
  }

  const getButtonText = (plan) => {
    if (isCurrentPlan(plan.id)) {
      return '✓ Current Plan'
    }
    return plan.cta
  }

  return (
    <div className="pricing-page">
      <div className="container">
        {/* Header */}
        <div className="pricing-header">
          <h1>Choose Your Plan</h1>
          <p>Start for free and upgrade when you need. Cancel anytime.</p>

          {userData?.plan && userData.plan !== 'free' && (
            <div className="current-plan-badge">
              ✨ Your current plan: <strong>{PLANS[userData.plan]?.name || userData.plan}</strong>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="plans-grid four-plans">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${plan.popular ? 'popular' : ''} ${isCurrentPlan(plan.id) ? 'current' : ''}`}
            >
              {plan.popular && <span className="popular-badge">Most Popular</span>}
              {plan.savings && <span className="savings-badge">{plan.savings}</span>}

              <div className="plan-header">
                <h3>{plan.name}</h3>
                <div className="plan-interval">{plan.intervalLabel}</div>
                <div className="plan-price">
                  <span className="currency">{plan.currency || '€'}</span>
                  <span className="amount">{plan.price.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {isAuthenticated ? (
                <button
                  className={`btn plan-btn ${plan.id}-btn ${isCurrentPlan(plan.id) ? 'current-btn' : ''}`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrentPlan(plan.id)}
                >
                  {getButtonText(plan)}
                </button>
              ) : (
                <Link
                  to="/register"
                  className={`btn plan-btn ${plan.id}-btn`}
                >
                  {plan.id === 'free' ? 'Start for Free' : 'Create Account'}
                </Link>
              )}
            </div>
          ))}
        </div>

        {!isAuthenticated && (
          <div className="login-cta">
            <p>Already have an account? <Link to="/login">Log in</Link> to subscribe to a plan.</p>
          </div>
        )}

        {/* QR Code Feature Highlight */}
        <div className="qrcode-feature-highlight">
          <div className="qrcode-highlight-content">
            <div className="qrcode-highlight-text">
              <span className="badge">Prime Feature</span>
              <h2>Beautiful & Professional QR Codes</h2>
              <p>
                Stand out with customized QR codes. Pro and Premium users can customize colors, add their profile photo to the center, and download high-resolution files.
              </p>
              <ul className="highlight-list">
                <li>✨ Custom branding colors</li>
                <li>🖼️ Centered profile photo</li>
                <li>🚀 High-resolution SVG & PNG</li>
                <li>📱 Perfect for business cards & prints</li>
              </ul>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => handleSubscribe('pro')}
              >
                Get Custom QR Code
              </button>
            </div>
            <div className="qrcode-highlight-preview">
              <div className="premium-qr-display">
                <QRCodeCustom
                  value="https://linkrole.net/demo"
                  size={240}
                  userPhoto="https://api.dicebear.com/7.x/avataaars/svg?seed=LinkRole"
                  primaryColor="#0ea5e9"
                />
                <div className="preview-label">Live Preview</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="features-section">
          <h2>Compare Plans</h2>
          <div className="features-table four-cols">
            <div className="table-header">
              <div className="feature-name"></div>
              <div className="plan-col">Free</div>
              <div className="plan-col">Basic</div>
              <div className="plan-col highlight pro">Pro ⭐</div>
              <div className="plan-col">Premium</div>
            </div>
            <div className="table-row">
              <div className="feature-name">Billing</div>
              <div className="plan-col">—</div>
              <div className="plan-col">Weekly</div>
              <div className="plan-col highlight pro">Monthly</div>
              <div className="plan-col">Annual</div>
            </div>
            <div className="table-row">
              <div className="feature-name">Links</div>
              <div className="plan-col">Unlimited</div>
              <div className="plan-col">Unlimited</div>
              <div className="plan-col highlight pro">Unlimited</div>
              <div className="plan-col">Unlimited</div>
            </div>
            <div className="table-row">
              <div className="feature-name">QR Code</div>
              <div className="plan-col">Basic</div>
              <div className="plan-col">✓</div>
              <div className="plan-col highlight pro">Custom</div>
              <div className="plan-col">Custom</div>
            </div>
            <div className="table-row">
              <div className="feature-name">Analytics History</div>
              <div className="plan-col">7 days</div>
              <div className="plan-col">14 days</div>
              <div className="plan-col highlight pro">30 days</div>
              <div className="plan-col">Unlimited</div>
            </div>
            <div className="table-row">
              <div className="feature-name">Link Performance</div>
              <div className="plan-col">❌</div>
              <div className="plan-col">✓</div>
              <div className="plan-col highlight pro">✓</div>
              <div className="plan-col">✓</div>
            </div>
            <div className="table-row">
              <div className="feature-name">Custom Themes</div>
              <div className="plan-col">❌</div>
              <div className="plan-col">❌</div>
              <div className="plan-col highlight pro">✓</div>
              <div className="plan-col">✓</div>
            </div>
            <div className="table-row">
              <div className="feature-name">Remove LinkRole Branding</div>
              <div className="plan-col">❌</div>
              <div className="plan-col">❌</div>
              <div className="plan-col highlight pro">✓</div>
              <div className="plan-col">✓</div>
            </div>
            <div className="table-row">
              <div className="feature-name">Custom Domain</div>
              <div className="plan-col">❌</div>
              <div className="plan-col">❌</div>
              <div className="plan-col highlight pro">❌</div>
              <div className="plan-col">✓</div>
            </div>
            <div className="table-row">
              <div className="feature-name">API Access</div>
              <div className="plan-col">❌</div>
              <div className="plan-col">❌</div>
              <div className="plan-col highlight pro">❌</div>
              <div className="plan-col">✓</div>
            </div>
            <div className="table-row">
              <div className="feature-name">Support</div>
              <div className="plan-col">Community</div>
              <div className="plan-col">Email</div>
              <div className="plan-col highlight pro">Priority</div>
              <div className="plan-col">24/7 Dedicated</div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item card">
                <h4>{faq.question}</h4>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="pricing-cta">
          <h2>Still have questions?</h2>
          <p>Contact our team for personalized help</p>
          <a href="mailto:support@linkrole.net" className="btn btn-secondary btn-lg">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}

export default Pricing
