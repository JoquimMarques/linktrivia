import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// Flutterwave payment links (sandbox mode)
export const FLUTTERWAVE_LINKS = {
  basic: 'https://sandbox.flutterwave.com/pay/45xuujyyn5yj',
  pro: 'https://sandbox.flutterwave.com/pay/geuotue7neoy',
  premium: 'https://sandbox.flutterwave.com/pay/mxp5vedw7enc'
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
      'Unlimited links',
      'Basic QR Code',
      'Simple statistics (7 days)',
      'Standard themes',
      'LinkRole Branding'
    ],
    limits: {
      maxLinks: Infinity,
      analytics: 'basic',
      analyticsMaxDays: 7,
      linkPerformance: false,
      qrCode: true,
      qrCodeCustom: false,
      customThemes: false,
      removeBranding: false,
      prioritySupport: false
    }
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 1.99,
    currency: '€',
    interval: 'week',
    intervalLabel: 'per week',
    paymentLink: FLUTTERWAVE_LINKS.basic,
    features: [
      'Unlimited links',
      'QR Code',
      'Statistics (14 days)',
      'Link performance',
      'Standard themes',
      'LinkRole Branding'
    ],
    limits: {
      maxLinks: Infinity,
      analytics: 'basic',
      analyticsMaxDays: 14,
      linkPerformance: true,
      qrCode: true,
      qrCodeCustom: false,
      customThemes: false,
      removeBranding: false,
      prioritySupport: false
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 3.99,
    currency: '€',
    interval: 'month',
    intervalLabel: 'per month',
    paymentLink: FLUTTERWAVE_LINKS.pro,
    popular: true,
    features: [
      'Unlimited links',
      'Custom QR Code',
      'Advanced analytics (30 days)',
      'Link performance',
      'Custom themes',
      'Remove LinkRole branding',
      'Priority support'
    ],
    limits: {
      maxLinks: Infinity,
      analytics: 'advanced',
      analyticsMaxDays: 30,
      linkPerformance: true,
      qrCode: true,
      qrCodeCustom: true,
      customThemes: true,
      removeBranding: true,
      prioritySupport: true
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 39.99,
    currency: '€',
    interval: 'year',
    intervalLabel: 'per year',
    paymentLink: FLUTTERWAVE_LINKS.premium,
    savings: 'Save 17%',
    features: [
      'Everything in Pro',
      'Unlimited analytics',
      'Custom domain',
      'API Access',
      '24/7 Dedicated support',
      'Exclusive features'
    ],
    limits: {
      maxLinks: Infinity,
      analytics: 'unlimited',
      analyticsMaxDays: 365,
      linkPerformance: true,
      qrCode: true,
      qrCodeCustom: true,
      customThemes: true,
      removeBranding: true,
      prioritySupport: true,
      customDomain: true,
      apiAccess: true
    }
  }
}

// Redirect to Flutterwave payment link
export const redirectToPayment = (planId, userEmail, userId) => {
  const plan = PLANS[planId]
  if (!plan || !plan.paymentLink) {
    console.error('Plan not found or no payment link:', planId)
    return
  }

  // Add user info as query params for tracking
  const paymentUrl = new URL(plan.paymentLink)
  if (userEmail) {
    paymentUrl.searchParams.set('customer_email', userEmail)
  }
  if (userId) {
    paymentUrl.searchParams.set('customer_id', userId)
  }

  window.open(paymentUrl.toString(), '_blank')
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
