const functions = require('firebase-functions')
const admin = require('firebase-admin')
const flutterwave = require('./flutterwave')

admin.initializeApp()

// Export Flutterwave functions
exports.flutterwaveWebhook = flutterwave.webhook
