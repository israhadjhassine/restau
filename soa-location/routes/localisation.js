const express = require("express");
const router = express.Router();
const Localisation = require("../models/Livreur");

// Mettre à jour la position
router.post("/update", async (req, res) => {
  console.log("Requête reçue :", req.body); 
  const { livreurId, latitude, longitude } = req.body;

 try {
    const result = await Localisation.findOneAndUpdate(
      { livreurId },
      { latitude, longitude },
      { upsert: true, new: true } // crée si n'existe pas et retourne le doc
    );
    console.log("Document mis à jour :", result);
    res.json({ success: true, message: "Localisation mise à jour" });
  } catch (err) {
    console.log("Erreur MongoDB :", err);
    res.status(500).json({ success: false, message: "Erreur MongoDB" });
  }
});

// Récupérer localisation d’un livreur
router.get("/:id", async (req, res) => {
  const loc = await Localisation.findOne({ livreurId: req.params.id });
  res.json(loc);
});

module.exports = router;
