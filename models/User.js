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

  statut: {
    type: String,
    enum: ["en_attente", "valide", "bloque"],
    default: "en_attente"
  }
}, { discriminatorKey: "role", timestamps: true });
const User = mongoose.model("User", UserSchema); // <-- définir ici

async function getNextUserId() {
  const lastUser = await User.findOne().sort({ id_user: -1 });
  return lastUser ? lastUser.id_user + 1 : 1;
}

UserSchema.pre("save", async function (next) {
  if (!this.id_user) {
    this.id_user = await getNextUserId();
  }
  next();
});

module.exports = User;