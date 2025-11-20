const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const livreurController = require("../controllers/livreurController");

// Tableau de bord livreur
router.get("/dashboard", auth, (req, res) => {
  res.render("livreur/dashboard", { user: req.user });
});

// ✔️ Voir les commandes assignées
router.get("/commandes", auth, livreurController.getCommandes);

// ✔️ Modifier disponibilité
router.post("/disponibilite", auth, livreurController.setDisponibilite);

// ✔️ Modifier statut commande
router.post("/commande/:id/statut", auth, livreurController.updateStatutCommande);

// ✔️ Mise à jour localisation
router.post("/localisation", auth, livreurController.updateLocalisation);

module.exports = router;
