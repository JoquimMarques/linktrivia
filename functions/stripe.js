const functions = require('firebase-functions')
const admin = require('firebase-admin')

const db = admin.firestore()

// Stripe secret key and webhook secret (set via Firebase functions config)
const STRIPE_SECRET_KEY = functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET

// Initialize Stripe
const stripe = require('stripe')(STRIPE_SECRET_KEY)

// Map Stripe price IDs to plan names
// You can customize this based on your Stripe product/price IDs
const PLAN_MAPPING = {
    // Weekly Basic plan
    'price_basic_weekly': 'basic',
    // Monthly Pro plan  
    'price_pro_monthly': 'pro',
    // Yearly Premium plan
    'price_premium_yearly': 'premium',
    // Add your actual Stripe Price IDs here
    // You can find these in your Stripe Dashboard under Products
}

// Map plan names from metadata
const PLAN_NAME_MAPPING = {
    'basic': 'basic',
    'pro': 'pro',
    'premium': 'premium',
    'Basic': 'basic',
    'Pro': 'pro',
    'Premium': 'premium'
}

/**
 * Stripe Webhook Handler
 * Processes payment events from Stripe
 */
exports.webhook = functions.https.onRequest(async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).send('Method not allowed')
    }

    const sig = req.headers['stripe-signature']
    let event

    try {
        // Verify webhook signature
        if (STRIPE_WEBHOOK_SECRET) {
            event = stripe.webhooks.constructEvent(
                req.rawBody,
                sig,
                STRIPE_WEBHOOK_SECRET
            )
        } else {
            // For testing without signature verification
            event = req.body
            console.warn('Webhook signature verification skipped - no secret configured')
        }
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message)
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    console.log('Stripe webhook received:', event.type)

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object
                await handleCheckoutSessionCompleted(session)
                break
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object
                await handleSubscriptionUpdated(subscription)
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object
                await handleSubscriptionDeleted(subscription)
                break
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object
                await handleInvoicePaymentSucceeded(invoice)
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object
                await handleInvoicePaymentFailed(invoice)
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return res.status(200).json({ received: true })
    } catch (error) {
        console.error('Webhook processing error:', error)
        return res.status(500).send('Webhook processing error')
    }
})

/**
 * Handle successful checkout session (new subscription)
 */
async function handleCheckoutSessionCompleted(session) {
    console.log('Processing checkout.session.completed:', {
        sessionId: session.id,
        customerEmail: session.customer_email,
        customerId: session.customer,
        metadata: session.metadata
    })

    const customerEmail = session.customer_email || session.customer_details?.email
    const userId = session.metadata?.userId || session.client_reference_id

    // Determine the plan from metadata or line items
    let plan = session.metadata?.plan || 'pro'
    plan = PLAN_NAME_MAPPING[plan] || plan

    // Find user by userId or email
    let userDoc = null

    if (userId) {
        const userRef = db.collection('users').doc(userId)
        userDoc = await userRef.get()
    }

    if (!userDoc?.exists && customerEmail) {
        const usersQuery = await db.collection('users')
            .where('email', '==', customerEmail)
            .limit(1)
            .get()

        if (!usersQuery.empty) {
            userDoc = usersQuery.docs[0]
        }
    }

    if (userDoc?.exists) {
        await userDoc.ref.update({
            plan: plan,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastPayment: {
                sessionId: session.id,
                amount: session.amount_total / 100,
                currency: session.currency,
                date: admin.firestore.FieldValue.serverTimestamp(),
                provider: 'stripe'
            }
        })

        console.log(`Updated user ${userDoc.id} to plan: ${plan}`)
    } else {
        console.error('User not found for payment:', { customerEmail, userId })

        // Store for manual reconciliation
        await db.collection('pending_payments').add({
            customerEmail,
            userId,
            plan,
            sessionId: session.id,
            stripeCustomerId: session.customer,
            amount: session.amount_total / 100,
            currency: session.currency,
            rawPayload: session,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
    }
}

/**
 * Handle subscription updates (plan changes)
 */
async function handleSubscriptionUpdated(subscription) {
    console.log('Processing customer.subscription.updated:', {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status
    })

    // Find user by Stripe customer ID
    const usersQuery = await db.collection('users')
        .where('stripeCustomerId', '==', subscription.customer)
        .limit(1)
        .get()

    if (!usersQuery.empty) {
        const userDoc = usersQuery.docs[0]

        // Check if subscription is active
        if (subscription.status === 'active') {
            // Get the plan from the price
            const priceId = subscription.items?.data[0]?.price?.id
            const plan = PLAN_MAPPING[priceId] || subscription.metadata?.plan || userDoc.data().plan

            await userDoc.ref.update({
                plan: plan,
                stripeSubscriptionStatus: subscription.status,
                planUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
            })

            console.log(`Updated subscription for user ${userDoc.id} to plan: ${plan}`)
        }
    }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription) {
    console.log('Processing customer.subscription.deleted:', {
        subscriptionId: subscription.id,
        customerId: subscription.customer
    })

    // Find user by Stripe customer ID
    const usersQuery = await db.collection('users')
        .where('stripeCustomerId', '==', subscription.customer)
        .limit(1)
        .get()

    if (!usersQuery.empty) {
        const userDoc = usersQuery.docs[0]

        await userDoc.ref.update({
            plan: 'free',
            stripeSubscriptionId: null,
            stripeSubscriptionStatus: 'cancelled',
            planUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        })

        console.log(`Downgraded user ${userDoc.id} to free plan`)
    }
}

/**
 * Handle successful invoice payment (subscription renewal)
 */
async function handleInvoicePaymentSucceeded(invoice) {
    console.log('Processing invoice.payment_succeeded:', {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        subscriptionId: invoice.subscription
    })

    // Update last payment info
    const usersQuery = await db.collection('users')
        .where('stripeCustomerId', '==', invoice.customer)
        .limit(1)
        .get()

    if (!usersQuery.empty) {
        const userDoc = usersQuery.docs[0]

        await userDoc.ref.update({
            lastPayment: {
                invoiceId: invoice.id,
                amount: invoice.amount_paid / 100,
                currency: invoice.currency,
                date: admin.firestore.FieldValue.serverTimestamp(),
                provider: 'stripe'
            }
        })
    }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice) {
    console.log('Processing invoice.payment_failed:', {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        subscriptionId: invoice.subscription
    })

    // Find user by Stripe customer ID
    const usersQuery = await db.collection('users')
        .where('stripeCustomerId', '==', invoice.customer)
        .limit(1)
        .get()

    if (!usersQuery.empty) {
        const userDoc = usersQuery.docs[0]

        // Downgrade to free plan when payment fails
        await userDoc.ref.update({
            plan: 'free',
            stripeSubscriptionStatus: 'payment_failed',
            planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastPaymentFailed: {
                invoiceId: invoice.id,
                date: admin.firestore.FieldValue.serverTimestamp(),
                reason: 'payment_failed'
            }
        })

        console.log(`Downgraded user ${userDoc.id} to free plan due to payment failure`)
    }
}
