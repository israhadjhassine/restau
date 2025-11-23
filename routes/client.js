const express = require("express");
const router = express.Router();
const ClientController = require("../controllers/ClientController");

// Use JWT authentication like your friends
const requireClientAuth = (req, res, next) => {
    if (!req.user || req.user.role !== "Client") {
        return res.redirect('/login?redirect=' + req.originalUrl);
    }
    next();
};

// Routes PUBLIQUES
router.get("/home-public", ClientController.homePublic);
router.get("/restaurants", ClientController.listRestaurants);
router.get("/menu/:id", ClientController.showMenu);
router.get("/cart", ClientController.showCart);

// Routes AJAX publiques
router.post("/cart/add", ClientController.addToCart);
router.post("/cart/update", ClientController.updateCart);
router.post("/cart/remove", ClientController.removeFromCart);
router.post("/cart/clear", ClientController.clearCart);
router.get("/cart/count", ClientController.getCartCount);

// Routes PRIVÉES (use JWT auth like your friends)
router.get("/home-private",  ClientController.homePrivate);
router.get("/checkout", requireClientAuth, ClientController.checkout);
router.post("/order", requireClientAuth, ClientController.placeOrder);
router.get("/confirmation", requireClientAuth, ClientController.confirmation);
router.get("/profile", requireClientAuth, ClientController.profile);

module.exports = router;