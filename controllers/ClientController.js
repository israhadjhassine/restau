const Restaurant = require("../models/Restaurant");
const Menu = require("../models/Menu");
const Plat = require("../models/Plat");
const Commande = require("../models/Commande");
const Paiement = require("../models/Paiement");
const StatutCommande = require("../models/StatutCommande");
const StatutPaiement = require("../models/StatutPaiement");

module.exports = {
  // ------------------ RESTAURANTS ------------------
  listRestaurants: async (req, res) => {
    const restaurants = await Restaurant.find().populate("menu");
    res.render("client/restaurants", { restaurants });
  },

  // ------------------ MENU + PLATS ------------------
  showMenu: async (req, res) => {
    const id = req.params.id;
    const menus = await Menu.find({ restaurant: id }).populate("plats");
    const restaurant = await Restaurant.findById(id);
    res.render("client/menu", { restaurant, menus });
  },

  // ------------------ PANIER ------------------
  showCart: (req, res) => {
    const cart = req.session.cart || [];
    res.render("client/cart", { cart });
  },

  addToCart: async (req, res) => {
    const platId = req.body.platId;
    const plat = await Plat.findById(platId);

    if (!req.session.cart) req.session.cart = [];

    const exists = req.session.cart.find(p => p._id == platId);

    if (exists) exists.quantity++;
    else req.session.cart.push({ ...plat.toObject(), quantity: 1 });

    res.redirect("/client/cart");
  },

  // ------------------ CHECKOUT ------------------
  checkout: (req, res) => {
    const cart = req.session.cart || [];
    const total = cart.reduce((t, p) => t + p.prix * p.quantity, 0);
    res.render("client/checkout", { cart, total });
  },

  // ------------------ COMMANDE + PAIEMENT ------------------
  placeOrder: async (req, res) => {
    const cart = req.session.cart || [];
    if (cart.length === 0) return res.redirect("/client/cart");

    const total = cart.reduce((t, p) => t + p.prix * p.quantity, 0);

    const commande = await Commande.create({
      id_commande: Date.now(),
      dateCommande: new Date(),
      montantTotal: total,
      statut: StatutCommande.EN_ATTENTE,
      plats: cart.map(p => p._id),
    });

    const paiement = await Paiement.create({
      id_paiement: Date.now(),
      datePaiement: new Date(),
      montant: total,
      statut: StatutPaiement.EFFECTUE,
      commande: commande._id,
    });

    req.session.cart = [];
    res.render("client/confirmation", { commande, paiement });
  },
};