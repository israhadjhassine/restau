const express = require("express");
const router = express.Router();
const verify = require("../middleware/auth");
const adminController = require("../controllers/adminController");

// Vérification admin
function isAdmin(req, res, next) {
  if (req.user.role !== "Admin")
    return res.status(403).send("Accès réservé à l'administrateur");
  next();
}

// Inscriptions
router.get("/inscriptions", verify, isAdmin, adminController.getInscriptionsEnAttente);
router.post("/valider/:id", verify, isAdmin, adminController.validerCompte);
router.post("/bloquer/:id", verify, isAdmin, adminController.bloquerCompte);

// Restaurants
router.get("/restaurants", verify, isAdmin, adminController.getRestaurants);
router.post("/restaurants/delete/:id", verify, isAdmin, adminController.supprimerRestaurant);

router.get("/dashboard", verify, isAdmin, (req, res) => {
  res.render("admin/dashboard");
});

module.exports = router;
