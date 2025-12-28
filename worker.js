/**
 * Cloudflare Worker - Stripe Webhook Handler for Orbilink
 * 
 * This worker receives Stripe webhooks and updates user plans in Firestore.
 * Deploy: wrangler deploy
 */

// Environment variables (set via wrangler secret)
// STRIPE_WEBHOOK_SECRET - Your Stripe webhook signing secret
// FIREBASE_PROJECT_ID - Your Firebase project ID
// FIREBASE_API_KEY - Your Firebase API key (for REST API)

export default {
    async fetch(request, env) {
        // Only allow POST requests
        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        // Get the Stripe signature header
        const signature = request.headers.get('stripe-signature');
        if (!signature) {
            return new Response('No signature', { status: 400 });
        }

        try {
            // Get the raw body
            const body = await request.text();

            // Verify webhook signature
            const event = await verifyStripeWebhook(body, signature, env.STRIPE_WEBHOOK_SECRET);

            if (!event) {
                return new Response('Invalid signature', { status: 400 });
            }

            console.log('Stripe event received:', event.type);

            // Handle the event
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object;
                    await handleCheckoutComplete(session, env);
                    break;
                }
                case 'customer.subscription.deleted': {
                    const subscription = event.data.object;
                    await handleSubscriptionCancelled(subscription, env);
                    break;
                }
                default:
                    console.log(`Unhandled event: ${event.type}`);
            }

            return new Response(JSON.stringify({ received: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Webhook error:', error);
            return new Response(`Webhook Error: ${error.message}`, { status: 500 });
        }
    }
};

/**
 * Verify Stripe webhook signature
 */
async function verifyStripeWebhook(payload, signature, secret) {
    // Parse signature header
    const elements = signature.split(',').reduce((acc, part) => {
        const [key, value] = part.split('=');
        acc[key] = value;
        return acc;
    }, {});

    const timestamp = elements['t'];
    const expectedSig = elements['v1'];

    if (!timestamp || !expectedSig) {
        throw new Error('Invalid signature format');
    }

    // Check timestamp is within tolerance (5 minutes)
    const tolerance = 300;
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestamp)) > tolerance) {
        throw new Error('Timestamp outside tolerance');
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const computedSig = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    // Compare signatures
    if (computedSig !== expectedSig) {
        throw new Error('Signature mismatch');
    }

    return JSON.parse(payload);
}

/**
 * Handle successful checkout - update user plan
 */
async function handleCheckoutComplete(session, env) {
    // Extract user ID and plan from client_reference_id (format: "userId_planId")
    const clientRef = session.client_reference_id;
    if (!clientRef) {
        console.error('No client_reference_id in session');
        return;
    }

    const [userId, planId] = clientRef.split('_');
    if (!userId || !planId) {
        console.error('Invalid client_reference_id format:', clientRef);
        return;
    }

    console.log(`Updating user ${userId} to plan: ${planId}`);

    // Update Firestore via REST API
    await updateUserPlan(userId, planId, {
        stripeCustomerId: session.customer,
        stripeSessionId: session.id,
        amount: session.amount_total / 100,
        currency: session.currency
    }, env);
}

/**
 * Handle subscription cancelled - downgrade to free
 */
async function handleSubscriptionCancelled(subscription, env) {
    // Find user by Stripe customer ID and downgrade
    // This requires querying Firestore which is more complex via REST API
    // For now, log the event - you may want to handle this differently
    console.log(`Subscription cancelled for customer: ${subscription.customer}`);
}

/**
 * Update user plan in Firestore via REST API
 */
async function updateUserPlan(userId, plan, paymentInfo, env) {
    const projectId = env.FIREBASE_PROJECT_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=plan&updateMask.fieldPaths=planUpdatedAt&updateMask.fieldPaths=lastPayment`;

    const body = {
        fields: {
            plan: { stringValue: plan },
            planUpdatedAt: { timestampValue: new Date().toISOString() },
            lastPayment: {
                mapValue: {
                    fields: {
                        sessionId: { stringValue: paymentInfo.stripeSessionId || '' },
                        customerId: { stringValue: paymentInfo.stripeCustomerId || '' },
                        amount: { doubleValue: paymentInfo.amount || 0 },
                        currency: { stringValue: paymentInfo.currency || 'eur' },
                        date: { timestampValue: new Date().toISOString() },
                        provider: { stringValue: 'stripe' }
                    }
                }
            }
        }
    };

    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            // For public Firestore rules, no auth needed
            // If your rules require auth, you'll need a service account
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Firestore update failed: ${error}`);
    }

    console.log(`Successfully updated user ${userId} to plan: ${plan}`);
}
