const functions = require('firebase-functions')
const admin = require('firebase-admin')
const flutterwave = require('./flutterwave')
const stripe = require('./stripe')

admin.initializeApp()

// Export Flutterwave functions (legacy)
exports.flutterwaveWebhook = flutterwave.webhook

const functions = require("firebase-functions");
const stripe = require("stripe")(functions.config().stripe.secret_key);

// Função HTTPS que recebe os webhooks
exports.stripeWebhook = functions.https.onRequest((req, res) => {
  const sig = req.headers['stripe-signature']; // cabeçalho enviado pelo Stripe
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody, 
      sig, 
      functions.config().stripe.webhook_secret
    );
  } catch (err) {
    console.error("Falha na verificação do webhook", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Aqui tratamos os eventos que queremos
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      console.log("Sessão de checkout completada:", session);
      // Atualiza o plano do usuário no Firestore
      break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "invoice.payment_succeeded":
      console.log("Evento:", event.type);
      // Outros tratamentos
      break;
    default:
      console.log(`Evento não tratado: ${event.type}`);
  }

  res.status(200).send({ received: true });
});
