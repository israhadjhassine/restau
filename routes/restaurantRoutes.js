const express = require("express");
const router = express.Router();

const restaurantController = require("../controllers/restaurantController");

// Dashboard
router.get("/home", restaurantController.getDashboard);

// Ajouter menu
router.post("/menus", restaurantController.ajouterMenu);

// Modifier menu
router.post("/menus/edit/:id", restaurantController.modifierMenu);

// Supprimer menu
router.post("/menus/delete/:id", restaurantController.supprimerMenu);

// Ajouter plat
router.post("/plats", restaurantController.ajouterPlat);

// Modifier plat
router.post("/plats/edit/:id", restaurantController.modifierPlat);

// Supprimer plat
router.post("/plats/delete/:id", restaurantController.supprimerPlat);





// Afficher toutes les commandes en attente
router.get("/commandes", restaurantController.getCommandesEnAttente);

// Récupérer les livreurs disponibles
router.get("/livreurs/disponibles", restaurantController.getLivreursDisponibles);

// Accepter une commande et assigner un livreur
router.post("/commandes/accepter", restaurantController.accepterCommande);




module.exports = router;
