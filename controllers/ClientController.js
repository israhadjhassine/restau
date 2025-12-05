const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const Plat = require('../models/Plat');
const Commande = require('../models/Commande');
const Client = require('../models/Client');
const User = require('../models/User');

function ensureCart(req) {
    if (!req.session) {
        console.error("SESSION NOT INITIALIZED!");
        return;
    }
    if (!req.session.cart) {
        req.session.cart = [];
    }
}

const ClientController = {
    // ================= PUBLIC =================
    homePublic: async (req, res) => {
        try {
            const featuredRestaurants = await Restaurant.find({ statut: "valide" }).limit(6);
            res.render('client/home-public', { 
                restaurants: featuredRestaurants,
                user: req.user || null  // ADD THIS
            });
        } catch (error) {
            console.error('Error in homePublic:', error);
            res.status(500).render('error', { message: 'Erreur serveur' });
        }
    },

    listRestaurants: async (req, res) => {
        try {
            const restaurants = await Restaurant.find({ statut: "valide" });
            res.render('client/restaurants', { 
                restaurants,
                user: req.user || null  // ADD THIS
            });
        } catch (error) {
            console.error('Error in listRestaurants:', error);
            res.status(500).render('error', { message: 'Erreur serveur' });
        }
    },

    showMenu: async (req, res) => {
        try {
            const restaurantId = req.params.id;
            const restaurant = await Restaurant.findById(restaurantId);
            if (!restaurant) return res.status(404).render('error', { message: 'Restaurant non trouvé' });

            const menu = await Menu.findOne({ restaurant: restaurantId }).populate('plats');
            const cart = (req.session && req.session.cart) ? req.session.cart : [];

            res.render('client/menu', { 
                restaurant, 
                menu: menu || { plats: [] }, 
                cart,
                user: req.user || null  // ADD THIS
            });
        } catch (error) {
            console.error('Error in showMenu:', error);
            res.status(500).render('error', { message: 'Erreur serveur' });
        }
    },

    // ================= CART =================
    showCart: (req, res) => {
        const cart = (req.session && req.session.cart) ? req.session.cart : [];
        const total = cart.reduce((sum, item) => sum + (parseFloat(item.prix || 0) * parseInt(item.quantite || 1)), 0);
        res.render('client/cart', { 
            cart, 
            total: total.toFixed(2),
            user: req.user || null  // ADD THIS
        });
    },



addToCart: async (req, res) => {
    try {
        console.log("🎯 Add to cart called with body:", req.body);
        
        // Ensure session exists
        if (!req.session) {
            console.error("❌ No session available");
            return res.status(500).json({ error: "Session non disponible" });
        }
        
        // Ensure cart exists in session
        if (!req.session.cart) {
            req.session.cart = [];
            console.log("🛒 Cart initialized");
        }
        
        // Accept both field names for compatibility
        const platId = req.body.platId || req.body.itemId;
        const name = req.body.nom || req.body.name;
        const price = req.body.prix || req.body.price;
        const restaurantId = req.body.restaurantId;
        const restaurantName = req.body.nomRestaurant;
        const quantity = req.body.quantite || req.body.quantity || 1;
        
        console.log("📊 Parsed data:", { platId, name, price, quantity });
        
        if (!platId) {
            console.error("❌ Missing platId/itemId");
            return res.status(400).json({ error: "ID du plat manquant" });
        }
        
        if (!name) {
            console.error("❌ Missing item name");
            return res.status(400).json({ error: "Nom du plat manquant" });
        }
        
        if (!price) {
            console.error("❌ Missing price");
            return res.status(400).json({ error: "Prix manquant" });
        }
        
        // Parse price to number
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice)) {
            console.error("❌ Invalid price:", price);
            return res.status(400).json({ error: "Prix invalide" });
        }
        
        // Check if we're adding to a different restaurant
        if (req.session.cart.length > 0) {
            const firstItem = req.session.cart[0];
            if (firstItem.restaurantId && firstItem.restaurantId !== restaurantId) {
                return res.json({ 
                    success: false, 
                    needConfirmation: true,
                    message: "Votre panier contient déjà des articles d'un autre restaurant. Voulez-vous vider votre panier et ajouter ce plat ?" 
                });
            }
        }
        
        // Check if item already exists in cart
        const existingItemIndex = req.session.cart.findIndex(item => 
            (item.itemId && item.itemId === platId) || 
            (item.id && item.id === platId)
        );
        
        if (existingItemIndex > -1) {
            // Update quantity if item exists
            const currentQuantite = parseInt(req.session.cart[existingItemIndex].quantite || req.session.cart[existingItemIndex].quantity || 1);
            const newQuantite = currentQuantite + parseInt(quantity);
            
            req.session.cart[existingItemIndex].quantite = newQuantite;
            req.session.cart[existingItemIndex].quantity = newQuantite;
            console.log("📈 Updated existing item quantity to:", newQuantite);
        } else {
            // Add new item with both field names for compatibility
            const newItem = {
                itemId: platId,
                id: platId,
                nom: name,
                name: name,
                prix: parsedPrice,
                price: parsedPrice,
                quantite: parseInt(quantity) || 1,
                quantity: parseInt(quantity) || 1,
                restaurantId: restaurantId,
                nomRestaurant: restaurantName
            };
            req.session.cart.push(newItem);
            console.log("🆕 Added new item to cart:", newItem);
        }
        
        console.log("✅ Cart after update:", req.session.cart);
        
        return res.json({ 
            success: true, 
            message: "Plat ajouté au panier !",
            cart: req.session.cart,
            cartCount: req.session.cart.length 
        });
        
    } catch (error) {
        console.error("🔥 Error in addToCart:", error);
        return res.status(500).json({ error: "Erreur serveur: " + error.message });
    }
},

updateCart: async (req, res) => {
    try {
        if (!req.session) {
            req.session = {};
        }
        if (!req.session.cart) {
            req.session.cart = [];
        }
        console.log("🔄 Update cart called with body:", req.body);

        const { itemId, quantite, quantity } = req.body;
        const newQuantite = quantite || quantity;
        
        if (!itemId || !newQuantite) {
            return res.status(400).json({ success: false, message: 'Données manquantes' });
        }
        
        const item = req.session.cart.find(item => 
            (item.itemId && item.itemId === itemId) || 
            (item.id && item.id === itemId)
        );
        
        if (item) {
            const parsedQuantite = parseInt(newQuantite);
            if (parsedQuantite < 1) {
                // Remove item if quantity is 0 or negative
                req.session.cart = req.session.cart.filter(item => 
                    !((item.itemId && item.itemId === itemId) || 
                      (item.id && item.id === itemId))
                );
                console.log("🗑️ Removed item with quantity:", parsedQuantite);
            } else {
                item.quantite = parsedQuantite;
                item.quantity = parsedQuantite;
                console.log("✅ Updated item quantity to:", parsedQuantite);
            }
        } else {
            console.log("❌ Item not found in cart:", itemId);
            return res.json({ success: false, message: 'Article non trouvé' });
        }

        return res.json({ 
            success: true, 
            cart: req.session.cart,
            message: 'Quantité mise à jour' 
        });
    } catch (err) {
        console.error("Error in updateCart:", err);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
},

removeFromCart: async (req, res) => {
    try {
        const { itemId } = req.body;
        console.log("🗑️ Remove from cart called for itemId:", itemId);
        
        if (!req.session || !req.session.cart) {
            return res.json({ success: false, message: 'Panier vide' });
        }
        
        const initialLength = req.session.cart.length;
        req.session.cart = req.session.cart.filter(item => 
            !((item.itemId && item.itemId === itemId) || 
              (item.id && item.id === itemId))
        );
        
        const removed = initialLength > req.session.cart.length;
        
        if (removed) {
            console.log("✅ Item removed from cart");
            return res.json({ 
                success: true, 
                cart: req.session.cart,
                message: 'Article supprimé du panier' 
            });
        } else {
            console.log("❌ Item not found in cart");
            return res.json({ 
                success: false, 
                message: 'Article non trouvé dans le panier' 
            });
        }
    } catch (error) {
        console.error('Error in removeFromCart:', error);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
},

clearCart: (req, res) => {
    try {
        if (!req.session) {
            req.session = {};
        }
        req.session.cart = [];
        console.log("🧹 Cart cleared");
        return res.json({ 
            success: true, 
            message: 'Panier vidé',
            cart: []
        });
    } catch (error) {
        console.error('Error in clearCart:', error);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
},

getCartCount: (req, res) => {
    try {
        const cart = req.session?.cart || [];
        const count = cart.reduce((sum, item) => sum + (parseInt(item.quantite || item.quantity || 1)), 0);
        console.log("📊 Cart count:", count);
        return res.json({ success: true, count });
    } catch (error) {
        console.error('Error in getCartCount:', error);
        return res.status(500).json({ success: false, count: 0 });
    }
},


    // ================= PRIVATE =================
  homePrivate: async (req, res) => {
        try {
            // req.user is already set by auth middleware
            const featuredRestaurants = await Restaurant.find({ statut: "valide" }).limit(6);
            const cart = (req.session && req.session.cart) ? req.session.cart : [];
            
            // Get client details from database using req.user.id
            const client = await Client.findById(req.user.id);
            
            res.render('client/home-private', { 
                restaurants: featuredRestaurants, 
                cart: cart,
                user: client || req.user
            });
        } catch (error) {
            console.error('Error in homePrivate:', error);
            res.status(500).render('error', { message: 'Erreur serveur' });
        }
    },

     checkout: (req, res) => {
        if (!req.user || req.user.role !== "Client") return res.redirect('/login?redirect=/client/checkout');

        const cart = (req.session && req.session.cart) ? req.session.cart : [];
        if (cart.length === 0) return res.redirect('/client/cart');

        const total = cart.reduce((sum, item) => sum + (parseFloat(item.prix) * parseInt(item.quantite)), 0);
        res.render('client/checkout', { cart, total: total.toFixed(2) });
    },

placeOrderAndRedirect: async (req, res) => {
    try {
        console.log("🚀 Starting placeOrderAndRedirect");
        
        if (!req.user || req.user.role !== "Client") {
            console.log("❌ User not authenticated or not a client");
            return res.redirect('/login?redirect=/client/cart');
        }

        const cart = req.session?.cart || [];
        console.log("🛒 Cart items:", cart.length);
        
        if (cart.length === 0) {
            console.log("❌ Cart is empty");
            return res.redirect('/client/cart');
        }

        // Calculate total
        const montantTotal = cart.reduce((sum, item) => {
            const price = parseFloat(item.prix || item.price || 0);
            const quantity = parseInt(item.quantite || item.quantity || 1);
            return sum + (price * quantity);
        }, 0);
        
        console.log("💰 Total amount:", montantTotal);

        // Get next commande ID
        const lastCommande = await Commande.findOne().sort({ id_commande: -1 });
        const nextId = lastCommande ? lastCommande.id_commande + 1 : 1;
        
        console.log("📋 Next commande ID:", nextId);

        // Extract plat IDs from cart
        const platIds = cart.map(item => item.itemId || item.id).filter(id => id);
        console.log("🍽️ Plat IDs to save:", platIds);

        // Create new commande
        const commande = new Commande({
            id_commande: nextId,
            dateCommande: new Date(),
            montantTotal: montantTotal,
            statut: "EN_ATTENTE",
            client: req.user.id,
            plats: platIds,
            restaurant: cart[0]?.restaurantId || null
        });

        console.log("💾 Saving commande...");
        await commande.save();
        console.log("✅ Commande saved with ID:", commande._id);

        // Clear cart after successful order
        req.session.cart = [];
        
        // Redirect to payment page (multiply by 100 for cents)
        const amountInCents = Math.round(montantTotal * 100);
        console.log("💳 Redirecting to payment with amount:", amountInCents);
        
        res.redirect(`/client/paiement?amount=${amountInCents}&commandeId=${commande._id}`);

    } catch (error) {
        console.error('🔥 Error in placeOrderAndRedirect:', error);
        res.status(500).render('error', { 
            message: 'Erreur lors de la commande: ' + error.message 
        });
    }
},
    confirmation: async (req, res) => {
    try {
        if (!req.user || req.user.role !== "Client") {
            return res.redirect('/login');
        }
        
        const commandeId = req.query.commandeId || req.query.id;
        
        // If you want to fetch the commande from database
        let commande = null;
        if (commandeId) {
            commande = await Commande.findById(commandeId);
        }
        
        res.render('client/confirmation', { 
            commandeId: commandeId,
            commande: commande,
            user: req.user 
        });
    } catch (error) {
        console.error('Error in confirmation:', error);
        res.status(500).render('error', { message: 'Erreur serveur' });
    }
},

    profile: async (req, res) => {
        try {
            if (!req.user || req.user.role !== "Client") return res.redirect('/login');
            const client = await Client.findById(req.user.id);
            res.render('client/profile', { client });
        } catch (error) {
            console.error('Error in profile:', error);
            res.status(500).render('error', { message: 'Erreur lors du chargement du profil' });
        }
    },

    updateProfile: async (req, res) => {
        try {
            if (!req.user || req.user.role !== "Client") return res.status(401).json({ success: false, message: 'Non autorisé' });

            const { username, email } = req.body;
            const updatedUser = await User.findByIdAndUpdate(req.user.id, { username, email }, { new: true });

            res.json({ success: true, message: 'Profil mis à jour avec succès', user: updatedUser });
        } catch (error) {
            console.error('Error in updateProfile:', error);
            res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du profil' });
        }
    },

    orderHistory: async (req, res) => {
        try {
            if (!req.user || req.user.role !== "Client") return res.redirect('/login');

            const commandes = await Commande.find({ client: req.user.id })
                .populate('plats')
                .sort({ dateCommande: -1 });

            res.render('client/order-history', { commandes });
        } catch (error) {
            console.error('Error in orderHistory:', error);
            res.status(500).render('error', { message: 'Erreur lors du chargement de l\'historique' });
        }
    },

    orderDetails: async (req, res) => {
        try {
            if (!req.user || req.user.role !== "Client") return res.redirect('/login');

            const commande = await Commande.findById(req.params.id).populate('plats').populate('client');
            if (!commande) return res.status(404).render('error', { message: 'Commande non trouvée' });
            if (commande.client._id.toString() !== req.user.id) return res.status(403).render('error', { message: 'Accès non autorisé' });

            res.render('client/order-details', { commande });
        } catch (error) {
            console.error('Error in orderDetails:', error);
            res.status(500).render('error', { message: 'Erreur lors du chargement des détails' });
        }
    },

    searchRestaurants: async (req, res) => {
        try {
            const { q } = req.query;
            let query = { statut: "valide" };
            if (q) query.nomRestaurant = { $regex: q, $options: 'i' };

            const restaurants = await Restaurant.find(query);
            res.render('client/restaurants', { restaurants, searchQuery: q });
        } catch (error) {
            console.error('Error in searchRestaurants:', error);
            res.status(500).render('error', { message: 'Erreur lors de la recherche' });
        }
    }
};

module.exports = ClientController;
