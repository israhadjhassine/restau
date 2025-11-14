const mongoose = require("mongoose");
const StatutPaiement = require("./StatutPaiement");

const PaiementSchema = new mongoose.Schema({
  id_paiement: {
    type: Number,
    unique: true,     
    
  },
  datePaiement: Date,
  montant: Number,
  statut: {
    type: String,
    enum: Object.values(StatutPaiement),
    default: StatutPaiement.EN_ATTENTE
  },
  commande: { type: mongoose.Schema.Types.ObjectId, ref: "Commande" }
});

module.exports = mongoose.model("Paiement", PaiementSchema);
