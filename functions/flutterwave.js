const functions = require('firebase-functions')
const admin = require('firebase-admin')

const db = admin.firestore()

// Flutterwave webhook secret hash (set in Flutterwave dashboard)
const FLUTTERWAVE_SECRET_HASH = functions.config().flutterwave?.secret_hash || process.env.FLUTTERWAVE_SECRET_HASH

// Map payment plan names to our plan IDs
const PLAN_MAPPING = {
  'basic': 'basic',
  'pro': 'pro', 
  'premium': 'premium',
  // Add variations of plan names as they might appear in Flutterwave
  'Basic': 'basic',
  'Pro': 'pro',
  'Premium': 'premium',
  'basic_weekly': 'basic',
  'pro_monthly': 'pro',
  'premium_yearly': 'premium'
}

/**
 * Flutterwave Webhook Handler
 * Processes payment events from Flutterwave
 */
exports.webhook = functions.https.onRequest(async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed')
  }

  try {
    // Verify webhook signature (using secret hash from Flutterwave)
    const secretHash = req.headers['verif-hash']
    
    if (FLUTTERWAVE_SECRET_HASH && secretHash !== FLUTTERWAVE_SECRET_HASH) {
      console.error('Invalid webhook signature')
      return res.status(401).send('Invalid signature')
    }

    const payload = req.body

    console.log('Flutterwave webhook received:', JSON.stringify(payload, null, 2))

    // Handle successful charge/payment
    if (payload.event === 'charge.completed' && payload.data?.status === 'successful') {
      const data = payload.data
      
      // Extract customer info
      const customerEmail = data.customer?.email
      const customerId = data.meta?.customer_id || data.customer?.id
      const planName = data.meta?.plan || data.tx_ref?.split('_')[0] || 'pro' // Get plan from meta or tx_ref
      
      console.log('Processing successful payment:', {
        customerEmail,
        customerId,
        planName,
        amount: data.amount,
        currency: data.currency,
        transactionId: data.id
      })

      // Determine the plan
      const plan = PLAN_MAPPING[planName] || 'pro'
      
      // Find user by email or customer ID
      let userDoc = null
      
      if (customerId) {
        // Try to find by customer ID first
        const userRef = db.collection('users').doc(customerId)
        userDoc = await userRef.get()
      }
      
      if (!userDoc?.exists && customerEmail) {
        // Fall back to finding by email
        const usersQuery = await db.collection('users')
          .where('email', '==', customerEmail)
          .limit(1)
          .get()
        
        if (!usersQuery.empty) {
          userDoc = usersQuery.docs[0]
        }
      }

      if (userDoc?.exists) {
        // Update user's plan
        await userDoc.ref.update({
          plan: plan,
          planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastPayment: {
            transactionId: data.id,
            amount: data.amount,
            currency: data.currency,
            date: admin.firestore.FieldValue.serverTimestamp(),
            provider: 'flutterwave'
          }
        })

        console.log(`Updated user ${userDoc.id} to plan: ${plan}`)
      } else {
        console.error('User not found for payment:', { customerEmail, customerId })
        // Store the payment for manual reconciliation
        await db.collection('pending_payments').add({
          customerEmail,
          customerId,
          plan,
          transactionId: data.id,
          amount: data.amount,
          currency: data.currency,
          rawPayload: data,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
      }
    }

    // Handle subscription events (if using Flutterwave subscriptions)
    if (payload.event === 'subscription.cancelled') {
      const data = payload.data
      const customerEmail = data.customer?.email
      
      if (customerEmail) {
        const usersQuery = await db.collection('users')
          .where('email', '==', customerEmail)
          .limit(1)
          .get()
        
        if (!usersQuery.empty) {
          await usersQuery.docs[0].ref.update({
            plan: 'free',
            planUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
          })
          
          console.log(`Downgraded user ${usersQuery.docs[0].id} to free plan`)
        }
      }
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return res.status(500).send('Webhook error')
  }
})

