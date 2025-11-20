const User = require("./User");
const mongoose = require("mongoose");

const LivreurSchema = new mongoose.Schema({
  disponible: {
    type: Boolean,
    default: true
  },

  localisation: {
    type: String, 
    default: ""
  }
});

module.exports = User.discriminator("Livreur", LivreurSchema);
