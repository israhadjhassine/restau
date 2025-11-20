const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema({
  titre: String,
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  plats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Plat" }]
});

module.exports = mongoose.model("Menu", MenuSchema);
