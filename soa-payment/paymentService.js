// soa-payment/paymentService.js
const Stripe = require('stripe'); 
require('dotenv').config();

// Fix the key if it starts with ssk_ instead of sk_
let stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (stripeSecretKey && stripeSecretKey.startsWith('ssk_')) {
    console.log("⚠️ Fixing Stripe key format from ssk_ to sk_");
    stripeSecretKey = 'sk_' + stripeSecretKey.substring(4);
}

let stripeInstance = null;
if (stripeSecretKey) {
    try {
        stripeInstance = new Stripe(stripeSecretKey, {
            apiVersion: "2022-11-15"
        });
        console.log("✅ Stripe initialized successfully");
    } catch (error) {
        console.error("❌ Failed to initialize Stripe:", error.message);
    }
}

module.exports = {
    createPaymentIntent: async (amount) => {
        try {
            console.log(`💰 Creating payment intent for: ${amount} cents`);
            
            if (!amount || amount < 50) { // Minimum 0.50
                throw new Error("Invalid amount");
            }
            
            // Use mock in development if Stripe not available
            if (!stripeInstance) {
                console.log("🔄 Using mock payment intent (no Stripe)");
                return `mock_secret_${Date.now()}_${amount}`;
            }
            
            // Create real Stripe payment intent
            const paymentIntent = await stripeInstance.paymentIntents.create({
                amount: parseInt(amount),
                currency: "usd", // or "eur" for Euros
                automatic_payment_methods: { enabled: true },
                metadata: {
                    order_id: `order_${Date.now()}`
                }
            });
            
            console.log("✅ Payment intent created:", paymentIntent.id);
            return paymentIntent.client_secret;
            
        } catch (error) {
            console.error("❌ Error creating payment intent:", error.message);
            
            // Return mock for development
            return `error_mock_${Date.now()}_${amount}`;
        }
    }
};