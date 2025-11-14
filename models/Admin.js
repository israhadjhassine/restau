const User = require("./User");
const mongoose = require("mongoose");

module.exports = User.discriminator("Admin", new mongoose.Schema({}));
