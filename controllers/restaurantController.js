const Restaurant = require("../models/Restaurant");
const Menu = require("../models/Menu");
const Plat = require("../models/Plat"); 

// Vérifier le rôle Restaurant
exports.isRestaurant = (req, res, next) => {
  if (req.user.role !== "Restaurant") return res.status(403).send("Accès réservé aux restaurants");
  next();
};

exports.getDashboard = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.id)
      .populate({
        path: "menu",
        populate: { path: "plats" }
      });

    if (!restaurant) return res.redirect("/login");

    res.render("restaurant/dashboard", { restaurant });
  } catch (err) {
    res.status(500).send(err.message);
  }
};



// Ajouter un menu
exports.ajouterMenu = async (req, res) => {
  try {
    const { titre } = req.body;

    if (!titre) return res.status(400).send("Titre du menu obligatoire");

    const menu = new Menu({
      titre,
      restaurant: req.user.id,
      plats: []
    });
    await menu.save();

    // Vérifie si le restaurant existe et que menu est bien un tableau
    const restaurant = await Restaurant.findById(req.user.id);
    if (!restaurant.menu) restaurant.menu = [];
    restaurant.menu.push(menu._id);
    await restaurant.save();

    res.redirect("/restaurant/home");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de l'ajout du menu : " + err.message);
  }
};


exports.modifierMenu = async (req, res) => {
  try {
    const { titre } = req.body;
    await Menu.findByIdAndUpdate(req.params.id, { titre });
    res.redirect("/restaurant/home");
  } catch (err) {
    res.status(400).send(err.message);
  }
};


exports.supprimerMenu = async (req, res) => {
  try {
    const menuId = req.params.id;

    // On supprime d'abord les plats associés
    await Plat.deleteMany({ menu: menuId });

    // Puis le menu
    await Menu.findByIdAndDelete(menuId);

    // On l'enlève aussi dans Restaurant.menu
    await Restaurant.updateMany({}, { $pull: { menu: menuId } });

    res.redirect("/restaurant/home");
  } catch (err) {
    res.status(400).send(err.message);
  }
};


exports.ajouterPlat = async (req, res) => {
  console.log(req.body); // 🔹 voir ce qui est envoyé
  try {
    const { nom, description, prix, image, menuTitre } = req.body;
    if (!nom || !description || !prix || !menuTitre) {
      return res.status(400).send("Veuillez remplir tous les champs du plat");
    }

    const menu = await Menu.findOne({ titre: menuTitre, restaurant: req.user.id });
    if (!menu) return res.status(404).send("Menu non trouvé");

    const plat = new Plat({ nom, description, prix, image, menu: menu._id });
    await plat.save();

    menu.plats.push(plat._id);
    await menu.save();

    res.redirect("/restaurant/home");
  } catch (err) {
    res.status(400).send(err.message);
  }
};

// Supprimer un plat
exports.supprimerPlat = async (req, res) => {
  try {
    const platId = req.params.id;

    // Supprimer le plat
    await Plat.findByIdAndDelete(platId);

    // Supprimer du menu associé
    await Menu.updateMany({ plats: platId }, { $pull: { plats: platId } });

    res.redirect("/restaurant/home");
  } catch (err) {
    res.status(400).send(err.message);
  }
};

exports.modifierPlat = async (req, res) => {
  try {
    const { nom, description, prix, image } = req.body;
    const platId = req.params.id;

    await Plat.findByIdAndUpdate(platId, { nom, description, prix, image });

    res.redirect("/restaurant/home");
  } catch (err) {
    res.status(400).send(err.message);
  }
};

