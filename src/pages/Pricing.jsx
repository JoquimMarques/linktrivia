import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PLANS, redirectToPayment } from '../services/payments'
import './Pricing.css'

const Pricing = () => {
  const { isAuthenticated, user, userData } = useAuth()
  const [expandedFaq, setExpandedFaq] = useState(null)

  // Check for successful payment redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const status = urlParams.get('status')
    const txRef = urlParams.get('tx_ref')

    if (status === 'successful' || status === 'completed' || txRef) {
      setTimeout(() => {
        window.location.href = '/dashboard?upgraded=true'
      }, 1500)
    }
  }, [])

  // Plans with features that match the system limits
  const plans = [
    {
      ...PLANS.free,
      cta: 'Start for Free',
      displayFeatures: [
        { text: '5 links', included: true },
        { text: 'Basic QR Code', included: true },
        { text: 'Smart Stats (7 days)', included: true },
        { text: 'Total clicks & views', included: true },
        { text: '2 username changes/month', included: true },
        { text: 'Linktrivia Branding', included: true, note: 'visible' },
        { text: 'Unlimited links', included: false },
        { text: 'Custom QR Code', included: false },
        { text: 'Custom Themes', included: false },
        { text: 'Remove Branding', included: false }
      ]
    },
    {
      ...PLANS.basic,
      cta: 'Subscribe Basic',
      displayFeatures: [
        { text: 'Unlimited links', included: true },
        { text: 'Custom QR Code', included: true },
        { text: 'Smart Stats (14 days)', included: true },
        { text: 'Total clicks & views', included: true },
        { text: '10 username changes/month', included: true },
        { text: 'Avg. Time on Page', included: false },
        { text: 'Bounce Rate', included: false },
        { text: 'Traffic Sources', included: false },
        { text: 'Remove Branding', included: false }
      ]
    },
    {
      ...PLANS.pro,
      cta: 'Subscribe Pro',
      displayFeatures: [
        { text: 'Unlimited links', included: true },
        { text: 'Custom QR Code', included: true },
        { text: 'Smart Stats (30 days)', included: true },
        { text: 'Remove Branding', included: true },
        { text: 'Link Performance', included: true },
        { text: 'Countries & Devices', included: true },
        { text: 'Unlimited username changes', included: true },
        { text: 'Avg. Time on Page', included: false },
        { text: 'Bounce Rate', included: false },
        { text: 'Traffic Sources', included: false }
      ]
    },
    {
      ...PLANS.premium,
      cta: 'Subscribe Premium',
      displayFeatures: [
        { text: 'Everything in Pro', included: true },
        { text: 'Unlimited Analytics History', included: true },
        { text: 'Traffic Sources', included: true },
        { text: 'Avg. Time on Page', included: true },
        { text: 'Bounce Rate', included: true },
        { text: '📈 Period Comparison', included: true },
        { text: '🕐 Peak Hours Analysis', included: true },
        { text: 'Priority Support', included: true }
      ]
    }
  ]

  const faqs = [
    {
      question: 'Can I change plans at any time?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you will pay the proportional difference. When downgrading, your new plan will start at the end of the current billing cycle.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept credit/debit cards, bank transfers, mobile money, and other local methods through our secure payment processor.'
    },
    {
      question: 'What happens when my subscription expires?',
      answer: 'Your account will automatically downgrade to the Free plan (5 links max). You will retain your links, but advanced features like custom QR codes and themes will become unavailable.'
    },
    {
      question: 'What is the difference between the plans?',
      answer: 'Free: 5 links, basic stats. Basic: Unlimited links, custom QR, 14 days stats. Pro: Custom themes, remove branding, link performance, countries & devices. Premium: Full analytics with Avg. Time, Bounce Rate, Traffic Sources, and priority support.'
    },
    {
      question: 'Can I get a refund?',
      answer: 'We offer a 7-day money-back guarantee for all paid plans. If you are not satisfied, contact our support team within 7 days of purchase for a full refund.'
    },
    {
      question: 'What is Link Performance?',
      answer: 'Link Performance shows you detailed analytics for each individual link, including click trends over time and geographic distribution. This feature is available on Pro and Premium plans.'
    }
  ]

  // Features comparison table data
  const comparisonFeatures = [
    { name: 'Links', free: '5', basic: 'Unlimited', pro: 'Unlimited', premium: 'Unlimited' },
    { name: 'QR Code', free: 'Basic', basic: 'Custom', pro: 'Custom', premium: 'Custom' },
    { name: 'Analytics Period', free: '7 days', basic: '14 days', pro: '30 days', premium: 'Unlimited' },
    { name: 'Total Clicks & Views', free: true, basic: true, pro: true, premium: true },
    { name: 'Countries & Devices', free: false, basic: false, pro: true, premium: true },
    { name: 'Link Performance', free: false, basic: false, pro: true, premium: true },
    { name: 'Avg. Time on Page', free: false, basic: false, pro: false, premium: true },
    { name: 'Bounce Rate', free: false, basic: false, pro: false, premium: true },
    { name: 'Traffic Sources', free: false, basic: false, pro: false, premium: true },
    { name: 'Custom Themes', free: false, basic: false, pro: true, premium: true },
    { name: 'Remove Branding', free: false, basic: false, pro: true, premium: true },
    { name: 'Priority Support', free: false, basic: false, pro: false, premium: true },
    { name: 'Username Changes/Month', free: '2', basic: '10', pro: 'Unlimited', premium: 'Unlimited' }
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

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  const renderFeatureValue = (value) => {
    if (value === true) {
      return <span className="feature-check">✓</span>
    }
    if (value === false) {
      return <span className="feature-cross">✗</span>
    }
    return <span className="feature-text">{value}</span>
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
                {plan.displayFeatures.map((feature, index) => (
                  <li key={index} className={feature.included ? 'included' : 'excluded'}>
                    {feature.included ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cross-icon">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                    {feature.text}
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

        {/* Stripe Pricing Table */}
        <div className="stripe-pricing-table-wrapper" style={{ margin: '60px 0 80px', textAlign: 'center' }}>
          <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
          <stripe-pricing-table
            pricing-table-id="prctbl_1SiWucLySWxQOvNVTEnZCEXu"
            publishable-key="pk_live_51SfMHfLySWxQOvNVgYfrgjn10ZHIT6Qnre0PWHpe8rGkf4ECEcqiF5Ofgt2UWno5b1PaIuuHe8Sq7L223Xfj0tEp00BpylTF5I"
          >
          </stripe-pricing-table>
        </div>

        {!isAuthenticated && (
          <div className="login-cta">
            <p>Already have an account? <Link to="/login">Log in</Link> to subscribe to a plan.</p>
          </div>
        )}

        {/* Features Comparison Table */}
        <div className="features-section">
          <h2>Compare All Features</h2>
          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Free</th>
                  <th>Basic</th>
                  <th className="highlight">Pro</th>
                  <th>Premium</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index}>
                    <td className="feature-name">{feature.name}</td>
                    <td>{renderFeatureValue(feature.free)}</td>
                    <td>{renderFeatureValue(feature.basic)}</td>
                    <td className="highlight">{renderFeatureValue(feature.pro)}</td>
                    <td>{renderFeatureValue(feature.premium)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQs */}
        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${expandedFaq === index ? 'expanded' : ''}`}
                onClick={() => toggleFaq(index)}
              >
                <div className="faq-question">
                  <span>{faq.question}</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`faq-arrow ${expandedFaq === index ? 'rotated' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                {expandedFaq === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="pricing-cta">
          <h2>Ready to grow your links?</h2>
          <p>Join thousands of creators and businesses using LinkRole to manage their online presence.</p>
          {!isAuthenticated ? (
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started Free
            </Link>
          ) : (
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Pricing