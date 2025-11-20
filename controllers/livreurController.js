const Commande = require("../models/Commande");
const Livreur = require("../models/Livreur");
const axios = require("axios"); // pour SOA localisation

module.exports = {

  // ✔️ Afficher les commandes assignées au livreur
  async getCommandes(req, res) {
    try {
      const commandes = await Commande.find({ livreur: req.user.id })
        .populate("client")
        .populate("plats");

      res.render("livreur/commandes", { commandes });
    } catch (error) {
      console.log(error);
      res.status(500).send("Erreur serveur");
    }
  },

  // ✔️ Mettre l'état disponible / indisponible
  async setDisponibilite(req, res) {
    try {
      const { disponible } = req.body;

      await Livreur.findByIdAndUpdate(req.user.id, {
        disponible: disponible === "true"
      });

      res.redirect("/livreur/dashboard");
    } catch (error) {
      console.log(error);
      res.status(500).send("Erreur serveur");
    }
  },

  // ✔️ Mettre à jour le statut d’une commande
  async updateStatutCommande(req, res) {
    try {
      const { id } = req.params;
      const { statut } = req.body;

      await Commande.findByIdAndUpdate(id, { statut });

      // Si la commande est livrée → le livreur redevient disponible
      if (statut === "LIVREE") {
        await Livreur.findByIdAndUpdate(req.user.id, { disponible: true });
      }

      res.redirect("/livreur/commandes");
    } catch (error) {
      console.log(error);
      res.status(500).send("Erreur lors de la mise à jour du statut");
    }
  },

  // ✔️ Mise à jour de la localisation (appel SOA)
  async updateLocalisation(req, res) {
    try {
      const { lat, long } = req.body;

      // 🔹 Mettre à jour la localisation dans MongoDB
    await Livreur.findByIdAndUpdate(req.user.id, {
    localisation: `${lat},${long}`
});
      // 🔥 Appel au microservice SOA avec l'_id MongoDB
      await axios.post("http://localhost:5001/localisation/update", {
        livreurId: req.user.id , 
        latitude: lat,
        longitude: long
        
      });

      res.send("Localisation mise à jour via SOA");
    } catch (error) {
      console.log(error);
      res.status(500).send("Erreur serveur localisation");
    }
  }

};
