const mongoose = require("mongoose");

const ReclamationSchema = new mongoose.Schema({
  id_reclamation:{
    type: Number,
    unique: true,     
  },
  message: String,
  date: Date,
  statut: String,
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }
});

module.exports = mongoose.model("Reclamation", ReclamationSchema);
