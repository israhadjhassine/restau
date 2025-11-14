const User = require("./User");
const mongoose = require("mongoose");

const LivreurSchema = new mongoose.Schema({
  localisation: String,
  disponible: Boolean,
});

module.exports = User.discriminator("Livreur", LivreurSchema);
