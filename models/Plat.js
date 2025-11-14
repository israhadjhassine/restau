const mongoose = require("mongoose");

const PlatSchema = new mongoose.Schema({
  id_plat:{
    type: Number,
    unique: true,     
    
  },
  nom: String,
  description: String,
  prix: Number,
  image: String,
  menu: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
});

module.exports = mongoose.model("Plat", PlatSchema);
