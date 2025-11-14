const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  id_user: {
    type: Number,
    unique: true,     
    index: true
  },
  username: String,
  email: String,
  password: String,
}, { discriminatorKey: "role", timestamps: true });

module.exports = mongoose.model("User", UserSchema);
