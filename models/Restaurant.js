const mongoose = require("mongoose");
const User = require("./User");

const RestaurantSchema = new mongoose.Schema({
  nomRestaurant: String,
  adresse: String,
  telephone: String,
  menu: [{ type: mongoose.Schema.Types.ObjectId, ref: "Menu" }] // <-- ajouté
});

module.exports = User.discriminator("Restaurant", RestaurantSchema);
