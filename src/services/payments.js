import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// Stripe payment links from environment variables
export const STRIPE_LINKS = {
  basic: import.meta.env.VITE_STRIPE_LINK_BASIC,
  pro: import.meta.env.VITE_STRIPE_LINK_PRO,
  premium: import.meta.env.VITE_STRIPE_LINK_PREMIUM
}

// Pricing plans configuration
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: '€',
    interval: null,
    intervalLabel: 'forever',
    features: [
      '5 links',
      'Basic QR Code',
      'Smart Stats (7 days)',
      'Total clicks & views',
      'LinkTrivia Branding'
    ],
    limits: {
      maxLinks: 5,
      analytics: 'basic',
      analyticsMaxDays: 7,
      totalClicks: true,
      avgTime: false,
      bounceRate: false,
      trafficSources: false,
      countriesDevices: false,
      linkPerformance: false,
      qrCode: true,
      qrCodeCustom: false,
      customThemes: false,
      removeBranding: false,
      prioritySupport: false,
      periodComparison: false,
      peakHours: false,
      usernameChangesLimit: 2
    }
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 1.99,
    currency: '€',
    interval: 'week',
    intervalLabel: 'per week',
    paymentLink: STRIPE_LINKS.basic,
    features: [
      'Unlimited links',
      'Custom QR Code',
      'Smart Stats (14 days)',
      'Total clicks & views',
      '10 username changes/month'
    ],
    limits: {
      maxLinks: Infinity,
      analytics: 'basic',
      analyticsMaxDays: 14,
      totalClicks: true,
      avgTime: false,
      bounceRate: false,
      trafficSources: false,
      countriesDevices: false,
      linkPerformance: false,
      qrCode: true,
      qrCodeCustom: true,
      customThemes: false,
      removeBranding: false,
      prioritySupport: false,
      periodComparison: false,
      peakHours: false,
      usernameChangesLimit: 10
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 3.99,
    currency: '€',
    interval: 'month',
    intervalLabel: 'per month',
    paymentLink: STRIPE_LINKS.pro,
    popular: true,
    features: [
      'Unlimited links',
      'Custom Themes',
      'Remove Branding',
      'Smart Stats (30 days)',
      'Link Performance',
      'Countries & Devices'
    ],
    limits: {
      maxLinks: Infinity,
      analytics: 'advanced',
      analyticsMaxDays: 30,
      totalClicks: true,
      avgTime: false,
      bounceRate: false,
      trafficSources: false,
      countriesDevices: true,
      linkPerformance: true,
      qrCode: true,
      qrCodeCustom: true,
      customThemes: true,
      removeBranding: true,
      prioritySupport: false,
      periodComparison: false,
      peakHours: false,
      usernameChangesLimit: Infinity
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 39.99,
    currency: '€',
    interval: 'year',
    intervalLabel: 'per year',
    paymentLink: STRIPE_LINKS.premium,
    savings: 'Save 17%',
    features: [
      'Everything in Pro',
      'Unlimited analytics',
      'Traffic Sources',
      'Avg. Time on Page',
      'Bounce Rate',
      'Priority Support'
    ],
    limits: {
      maxLinks: Infinity,
      analytics: 'unlimited',
      analyticsMaxDays: 365,
      totalClicks: true,
      avgTime: true,
      bounceRate: true,
      trafficSources: true,
      countriesDevices: true,
      linkPerformance: true,
      qrCode: true,
      qrCodeCustom: true,
      customThemes: true,
      removeBranding: true,
      prioritySupport: true,
      periodComparison: true,
      peakHours: true,
      usernameChangesLimit: Infinity
    }
  }
}

// Redirect to Stripe payment link
export const redirectToPayment = (planId, userEmail, userId) => {
  const plan = PLANS[planId]
  if (!plan || !plan.paymentLink) {
    console.error('Plan not found or no payment link:', planId)
    return
  }

  // Build the payment URL with tracking params
  const paymentUrl = new URL(plan.paymentLink)

  // Add prefilled email
  if (userEmail) {
    paymentUrl.searchParams.set('prefilled_email', userEmail)
  }

  // Add client reference for tracking (userId and planId)
  if (userId) {
    paymentUrl.searchParams.set('client_reference_id', `${userId}_${planId}`)
  }

  // Redirect to Stripe checkout (same window, not new tab)
  window.location.href = paymentUrl.toString()
}

// Update user plan (called by webhook)
export const updateUserPlan = async (userId, plan) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      plan,
      updatedAt: serverTimestamp()
    })
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Get plan features
export const getPlanFeatures = (planId) => {
  return PLANS[planId] || PLANS.free
}

// Check if user has access to feature
export const hasFeatureAccess = (userPlan, feature) => {
  const plan = PLANS[userPlan] || PLANS.free
  return plan.limits[feature]
}
