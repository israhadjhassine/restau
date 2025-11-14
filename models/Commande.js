const mongoose = require("mongoose");
const StatutCommande = require("./StatutCommande");

const CommandeSchema = new mongoose.Schema({
  id_commande:{
    type: Number,
    unique: true,     
    
  },
  dateCommande: Date,
  montantTotal: Number,
  statut: {
    type: String,
    enum: Object.values(StatutCommande),
    default: StatutCommande.EN_ATTENTE
  },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  livreur: { type: mongoose.Schema.Types.ObjectId, ref: "Livreur" },
  plats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Plat" }],
});

module.exports = mongoose.model("Commande", CommandeSchema);
