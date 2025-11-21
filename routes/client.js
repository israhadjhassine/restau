const express = require("express");
const router = express.Router();
const ClientController = require("../controllers/ClientController");

// Route pour la page d'accueil client
router.get("/home", (req, res) => {
  res.render("client/home");
});

// Autres routes client
router.get("/restaurants", ClientController.listRestaurants);
router.get("/menu/:id", ClientController.showMenu);
router.get("/cart", ClientController.showCart);
router.post("/cart/add", ClientController.addToCart);
router.get("/checkout", ClientController.checkout);
router.post("/order", ClientController.placeOrder);

module.exports = router;