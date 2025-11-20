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

module.exports = router;
