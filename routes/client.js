const express = require("express");
const router = express.Router();
const ClientController = require("../controllers/ClientController");
const authMiddleware = require("../middleware/auth");
const paymentService = require("../soa-payment/paymentService");
const mongoose = require('mongoose'); // ADD THIS LINE
const Commande = require("../models/Commande");
// Continue with the rest of your code...
// ---------- Public routes (no authentication required) ----------
router.get("/home-public", ClientController.homePublic);
router.get("/restaurants", ClientController.listRestaurants);
router.get("/menu/:id", ClientController.showMenu);
router.get("/cart", ClientController.showCart);

// Cart operations (public - can be done without login)
router.post("/cart/add", ClientController.addToCart);
router.post("/cart/update", ClientController.updateCart);
router.post("/cart/remove", ClientController.removeFromCart);
router.post("/cart/clear", ClientController.clearCart);
router.get("/cart/count", ClientController.getCartCount);

// ---------- Private routes (authentication required) ----------
router.get("/home-private", authMiddleware, ClientController.homePrivate);
router.get("/checkout", authMiddleware, ClientController.checkout);
router.post("/passerCommande", authMiddleware, ClientController.placeOrderAndRedirect);
router.get("/confirmation", authMiddleware, ClientController.confirmation);
router.get("/profile", authMiddleware, ClientController.profile);

// Payment routes
router.get("/paiement", authMiddleware, (req, res) => {
    const montant = parseInt(req.query.amount, 10);
    const commandeId = req.query.commandeId;
    
    if (!montant || isNaN(montant)) {
        return res.render('error', { message: 'Montant invalide' });
    }
    if (!commandeId) {
        return res.render('error', { message: 'Commande ID manquant' });
    }
    
    res.render('client/paiement', { 
        amount: montant, 
        commandeId: commandeId 
    });
});

router.get("/payment/check-stripe", authMiddleware, async (req, res) => {
    try {
        console.log("Checking Stripe availability...");
        
        const stripeAvailable = !!process.env.STRIPE_PUBLIC_KEY && !!process.env.STRIPE_SECRET_KEY;
        
        res.json({
            available: stripeAvailable,
            publicKey: process.env.STRIPE_PUBLIC_KEY || null,
            message: stripeAvailable ? "Stripe is configured" : "Stripe is not configured"
        });
        
    } catch (error) {
        console.error("Error checking Stripe:", error);
        res.status(500).json({ 
            available: false, 
            error: error.message 
        });
    }
});

// Create Stripe payment intent
router.post("/payment/create-payment-intent", authMiddleware, async (req, res) => {
    try {
        console.log("Creating payment intent with body:", req.body);
        
        const { amount } = req.body;
        
        if (!amount) {
            return res.status(400).json({ error: "Montant requis" });
        }
        
        // Validate amount
        const amountNum = parseInt(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({ error: "Montant invalide" });
        }
        
        console.log("Creating payment intent for amount:", amountNum);
        
        const clientSecret = await paymentService.createPaymentIntent(amountNum);
        
        res.json({ 
            success: true, 
            clientSecret: clientSecret 
        });
        
    } catch (err) {
        console.error("❌ Payment intent error:", err);
        res.status(500).json({ 
            error: err.message,
            details: "Failed to create payment intent"
        });
    }
});

// Confirm simple payment (non-Stripe)
router.post("/payment/confirm-simple", authMiddleware, async (req, res) => {
    try {
        console.log("Confirming simple payment with body:", req.body);
        
        const { commandeId, amount, paymentMethod } = req.body;
        
        if (!commandeId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Commande ID requis' 
            });
        }
        
        // Validate commandeId format
        if (!mongoose.Types.ObjectId.isValid(commandeId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Format de commande ID invalide' 
            });
        }
        
        // Find and update the commande
        const updatedCommande = await Commande.findByIdAndUpdate(
            commandeId,
            {
                statut: "PAYE",
                paymentMethod: paymentMethod || "cash",
                paymentDate: new Date(),
                paymentAmount: amount ? parseInt(amount) / 100 : 0
            },
            { new: true }
        );
        
        if (!updatedCommande) {
            return res.status(404).json({ 
                success: false, 
                message: 'Commande non trouvée' 
            });
        }
        
        console.log("✅ Payment confirmed for commande:", updatedCommande._id);
        
        res.json({ 
            success: true, 
            message: 'Paiement confirmé avec succès',
            commandeId: commandeId,
            amount: amount,
            paymentMethod: paymentMethod
        });
        
    } catch (error) {
        console.error("❌ Confirm simple payment error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            details: "Server error confirming payment"
        });
    }
});

// Simple test route to check if payment routes work
router.get("/payment/test", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Payment routes are working",
        timestamp: new Date().toISOString(),
        user: req.user?.username
    });
});

module.exports = router;