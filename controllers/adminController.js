const User = require("../models/User");
const Restaurant = require("../models/Restaurant");

// Liste des inscriptions en attente
exports.getInscriptionsEnAttente = async (req, res) => {
  const users = await User.find({ statut: "en_attente" });
  res.render("admin/inscriptions", { users });
};

// Valider un compte
exports.validerCompte = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { statut: "valide" });
  res.redirect("/admin/inscriptions");
};

// Bloquer un compte
exports.bloquerCompte = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { statut: "bloque" });
  res.redirect("/admin/inscriptions");
};

// Liste des restaurants
exports.getRestaurants = async (req, res) => {
  const restaurants = await Restaurant.find();
  res.render("admin/restaurants", { restaurants });
};

// Supprimer un restaurant
exports.supprimerRestaurant = async (req, res) => {
  await Restaurant.findByIdAndDelete(req.params.id);
  res.redirect("/admin/restaurants");
};
