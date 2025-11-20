const mongoose = require("mongoose");

const LivreurSchema = new mongoose.Schema({
  livreurId: String,
  latitude: Number,
  longitude: Number
});

module.exports = mongoose.model("LocalisationLivreur", LivreurSchema);
