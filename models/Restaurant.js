const mongoose = require("mongoose");
const User = require("./User");

const RestaurantSchema = new mongoose.Schema({
  nomRestaurant: String,
  adresse: String,
  telephone: String
});

module.exports = User.discriminator("Restaurant", RestaurantSchema);
