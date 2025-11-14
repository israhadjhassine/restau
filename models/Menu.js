const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema({
  id_menu:{
    type: Number,
    unique: true,     
  },
  titre: String,
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
});

MenuSchema.pre("deleteOne", { document: true, query: false }, async function(next) {
  await Plat.deleteMany({ menu: this._id });
  next();
});


module.exports = mongoose.model("Menu", MenuSchema);
