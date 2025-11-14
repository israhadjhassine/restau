const User = require("./User");
const mongoose = require("mongoose");

module.exports = User.discriminator(
  "Client",
  new mongoose.Schema({})
);
