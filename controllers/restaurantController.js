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

const Commande = require("../models/Commande");
const Livreur = require("../models/Livreur");

exports.getCommandesEnAttente = async (req, res) => {
  try {
    const commandes = await Commande.find({ statut: "EN_ATTENTE" })
      .populate("client")
      .populate("plats");
    res.render("restaurant/commande", { commandes });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.getLivreursDisponibles = async (req, res) => {
  try {
    const livreurs = await Livreur.find({ disponible: true ,  statut: "valide"});
    res.json(livreurs);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

/*exports.accepterCommande = async (req, res) => {
  try {
    const { commandeId, livreurId } = req.body;
    await Commande.findByIdAndUpdate(commandeId, {
      statut: "ACCEPTEE",
      livreur: livreurId
    });
    await Livreur.findByIdAndUpdate(livreurId, { disponible: false });
    res.sendStatus(200);
    
  } catch (err) {
    res.status(500).send(err.message);
  }
};*/
const { sendEmail } = require("../utils/mailer");
exports.accepterCommande = async (req, res) => {
  try {
    const { commandeId, livreurId } = req.body;

    // 1️⃣ Récupérer commande + client
    const commande = await Commande.findById(commandeId).populate("client");
    if (!commande) return res.status(404).send("Commande introuvable");

    // 2️⃣ Récupérer livreur
    const livreur = await Livreur.findById(livreurId);
    if (!livreur) return res.status(404).send("Livreur introuvable");

    // 3️⃣ Mettre à jour commande + livreur
    commande.statut = "EN_LIVRAISON";
    commande.livreur = livreurId;
    await commande.save();

    livreur.disponible = false;
    await livreur.save();

    // 4️⃣ ENVOI DES EMAILS
    await sendEmail(
      commande.client.email,
      "Commande acceptée",
      `Bonjour ${commande.client.username},

Votre commande numéro #${commande. plats} a été acceptée.
Un livreur va vous contacter et la livraison commencera bientôt.

Merci pour votre confiance.`
    );

    await sendEmail(
         livreur.email,
      "Nouvelle commande à livrer",
      `Bonjour ${livreur.username},

Une nouvelle commande vous a été attribuée.
Numéro de commande : #${commande.id_commande}.

Veuillez vous préparer pour la livraison.`
    );

    // 5️⃣ Réponse finale
    res.send("Commande acceptée et emails envoyés !");
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};



