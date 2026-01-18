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
                case 'invoice.payment_failed': {
                    const invoice = event.data.object;
                    await handlePaymentFailed(invoice, env);
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
    console.log('=== CHECKOUT SESSION COMPLETED ===');
    console.log('Session ID:', session.id);
    console.log('Customer:', session.customer);
    console.log('Customer Email:', session.customer_email);
    console.log('Client Reference ID:', session.client_reference_id);
    console.log('Metadata:', JSON.stringify(session.metadata));
    console.log('Amount:', session.amount_total);

    // Extract user ID and plan from client_reference_id (format: "userId_planId")
    const clientRef = session.client_reference_id;
    if (!clientRef) {
        console.error('ERROR: No client_reference_id in session!');
        console.log('Full session object:', JSON.stringify(session));
        return;
    }

    const [userId, planId] = clientRef.split('_');
    if (!userId || !planId) {
        console.error('ERROR: Invalid client_reference_id format:', clientRef);
        return;
    }

    console.log(`Parsed - User ID: ${userId}, Plan ID: ${planId}`);

    // Update Firestore via REST API
    try {
        await updateUserPlan(userId, planId, {
            stripeCustomerId: session.customer,
            stripeSessionId: session.id,
            amount: session.amount_total / 100,
            currency: session.currency
        }, env);
        console.log('SUCCESS: User plan updated!');
    } catch (error) {
        console.error('ERROR updating user plan:', error.message);
    }
}

/**
 * Handle subscription cancelled - downgrade to free
 */
async function handleSubscriptionCancelled(subscription, env) {
    console.log('=== SUBSCRIPTION CANCELLED ===');
    console.log('Customer ID:', subscription.customer);

    // Query Firestore to find user by stripeCustomerId
    const user = await findUserByStripeCustomerId(subscription.customer, env);

    if (user) {
        await downgradeUserToFree(user.userId, 'subscription_cancelled', env);
        console.log(`SUCCESS: Downgraded user ${user.userId} to free plan`);
    } else {
        console.log('WARNING: No user found for customer:', subscription.customer);
    }
}

/**
 * Handle payment failed - downgrade to free
 */
async function handlePaymentFailed(invoice, env) {
    console.log('=== PAYMENT FAILED ===');
    console.log('Customer ID:', invoice.customer);
    console.log('Invoice ID:', invoice.id);

    // Query Firestore to find user by stripeCustomerId
    const user = await findUserByStripeCustomerId(invoice.customer, env);

    if (user) {
        await downgradeUserToFree(user.userId, 'payment_failed', env);
        console.log(`SUCCESS: Downgraded user ${user.userId} to free plan due to payment failure`);
    } else {
        console.log('WARNING: No user found for customer:', invoice.customer);
    }
}

/**
 * Find user by Stripe Customer ID via Firestore REST API
 */
async function findUserByStripeCustomerId(stripeCustomerId, env) {
    const projectId = env.FIREBASE_PROJECT_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

    const query = {
        structuredQuery: {
            from: [{ collectionId: 'users' }],
            where: {
                fieldFilter: {
                    field: { fieldPath: 'stripeCustomerId' },
                    op: 'EQUAL',
                    value: { stringValue: stripeCustomerId }
                }
            },
            limit: 1
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
    });

    if (!response.ok) {
        console.error('Firestore query failed:', await response.text());
        return null;
    }

    const results = await response.json();

    if (results && results[0] && results[0].document) {
        const docPath = results[0].document.name;
        const userId = docPath.split('/').pop();
        return { userId };
    }

    return null;
}

/**
 * Downgrade user to free plan
 */
async function downgradeUserToFree(userId, reason, env) {
    const projectId = env.FIREBASE_PROJECT_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=plan&updateMask.fieldPaths=planUpdatedAt&updateMask.fieldPaths=stripeSubscriptionStatus`;

    const body = {
        fields: {
            plan: { stringValue: 'free' },
            planUpdatedAt: { timestampValue: new Date().toISOString() },
            stripeSubscriptionStatus: { stringValue: reason }
        }
    };

    const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Firestore update failed: ${error}`);
    }

    console.log(`Downgraded user ${userId} to free plan (reason: ${reason})`);
}

/**
 * Update user plan in Firestore via REST API
 */
async function updateUserPlan(userId, plan, paymentInfo, env) {
    const projectId = env.FIREBASE_PROJECT_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=plan&updateMask.fieldPaths=planUpdatedAt&updateMask.fieldPaths=planExpiryDate&updateMask.fieldPaths=lastPayment&updateMask.fieldPaths=stripeCustomerId`;

    // Calculate expiry date
    const now = new Date();
    let expiryDate = null;

    if (plan === 'basic') {
        now.setDate(now.getDate() + 7); // 1 week
        expiryDate = now.toISOString();
    } else if (plan === 'pro') {
        now.setMonth(now.getMonth() + 1); // 1 month
        expiryDate = now.toISOString();
    } else if (plan === 'premium') {
        now.setFullYear(now.getFullYear() + 1); // 1 year
        expiryDate = now.toISOString();
    }

    const body = {
        fields: {
            plan: { stringValue: plan },
            planUpdatedAt: { timestampValue: new Date().toISOString() },
            planExpiryDate: expiryDate ? { timestampValue: expiryDate } : { nullValue: null },
            stripeCustomerId: { stringValue: paymentInfo.stripeCustomerId || '' },
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
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Firestore update failed: ${error}`);
    }

    console.log(`Successfully updated user ${userId} to plan: ${plan}`);
}

