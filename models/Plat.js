const mongoose = require("mongoose");

const PlatSchema = new mongoose.Schema({
  nom: String,
  description: String,
  prix: Number,
  image: String,
  menu: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
});

module.exports = mongoose.model("Plat", PlatSchema); // ⚠️ Important !
