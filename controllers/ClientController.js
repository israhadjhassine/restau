const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const Plat = require('../models/Plat');
const Commande = require('../models/Commande');
const Client = require('../models/Client');
const User = require('../models/User');

const ClientController = {
    homePublic: async (req, res) => {
        try {
            const featuredRestaurants = await Restaurant.find({ statut: "valide" }).limit(6);
            res.render('client/home-public', { 
                restaurants: featuredRestaurants
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).render('error', { message: 'Erreur serveur' });
        }
    },

    homePrivate: async (req, res) => {
        try {
            const featuredRestaurants = await Restaurant.find({ statut: "valide" }).limit(6);
            const cart = req.session.cart || []; // Add cart data
            
            res.render('client/home-private', { 
                restaurants: featuredRestaurants,
                cart: cart // Pass cart to view for cart count display
            });
        } catch (error) {
            console.error('Error in homePrivate:', error);
            res.status(500).render('error', { message: 'Erreur serveur' });
        }
    },

    listRestaurants: async (req, res) => {
        try {
            const restaurants = await Restaurant.find({ statut: "valide" });
            res.render('client/restaurants', { 
                restaurants
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).render('error', { message: 'Erreur lors du chargement des restaurants' });
        }
    },

    showMenu: async (req, res) => {
        try {
            const restaurantId = req.params.id;
            const restaurant = await Restaurant.findById(restaurantId);
            
            if (!restaurant) {
                return res.status(404).render('error', { message: 'Restaurant non trouvé' });
            }

            const menu = await Menu.findOne({ restaurant: restaurantId }).populate('plats');
            const cart = req.session.cart || [];

            res.render('client/menu', { 
                restaurant, 
                menu: menu || { plats: [] },
                cart
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).render('error', { message: 'Erreur lors du chargement du menu' });
        }
    },

    showCart: (req, res) => {
        const cart = req.session.cart || [];
        const total = cart.reduce((sum, item) => {
            return sum + (parseFloat(item.prix || 0) * parseInt(item.quantite || 1));
        }, 0);
        
        res.render('client/cart', { 
            cart, 
            total: total.toFixed(2)
        });
    },

    addToCart: (req, res) => {
        try {
            const { itemId, nom, prix, restaurantId, nomRestaurant } = req.body;
            
            if (!req.session.cart) {
                req.session.cart = [];
            }

            if (req.session.cart.length > 0) {
                const currentRestaurantId = req.session.cart[0].restaurantId;
                if (currentRestaurantId !== restaurantId) {
                    return res.json({ 
                        success: false, 
                        message: `Votre panier contient des articles de ${req.session.cart[0].nomRestaurant}. Voulez-vous vider le panier et ajouter cet article?`,
                        needConfirmation: true
                    });
                }
            }

            const existingItem = req.session.cart.find(item => item.itemId === itemId);
            
            if (existingItem) {
                existingItem.quantite += 1;
            } else {
                req.session.cart.push({
                    itemId,
                    nom,
                    prix: parseFloat(prix),
                    quantite: 1,
                    restaurantId,
                    nomRestaurant
                });
            }

            res.json({ 
                success: true, 
                message: 'Article ajouté au panier!',
                cart: req.session.cart 
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
    },

    clearCart: (req, res) => {
        req.session.cart = [];
        res.json({ success: true, message: 'Panier vidé' });
    },

    updateCart: (req, res) => {
        try {
            const { itemId, quantite } = req.body;
            
            if (!req.session.cart) {
                return res.json({ success: false, message: 'Panier vide' });
            }

            const item = req.session.cart.find(item => item.itemId === itemId);
            if (item) {
                if (quantite <= 0) {
                    req.session.cart = req.session.cart.filter(item => item.itemId !== itemId);
                } else {
                    item.quantite = parseInt(quantite);
                }
            }

            res.json({ 
                success: true, 
                message: 'Quantité mise à jour',
                cart: req.session.cart 
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
    },

    removeFromCart: (req, res) => {
        try {
            const { itemId } = req.body;
            
            if (!req.session.cart) {
                return res.json({ success: false, message: 'Panier vide' });
            }

            req.session.cart = req.session.cart.filter(item => item.itemId !== itemId);

            res.json({ 
                success: true, 
                message: 'Article supprimé du panier',
                cart: req.session.cart 
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
    },

    checkout: (req, res) => {
        // Use req.user (from JWT) instead of req.session.user
        if (!req.user || req.user.role !== "Client") {
            return res.redirect('/login?redirect=/client/checkout');
        }

        const cart = req.session.cart || [];
        if (cart.length === 0) {
            return res.redirect('/client/cart');
        }

        const total = cart.reduce((sum, item) => {
            return sum + (parseFloat(item.prix) * parseInt(item.quantite));
        }, 0);
        
        res.render('client/checkout', { 
            cart, 
            total: total.toFixed(2)
        });
    },

    placeOrder: async (req, res) => {
        try {
            // Use req.user (from JWT)
            if (!req.user || req.user.role !== "Client") {
                return res.status(401).json({ success: false, message: 'Veuillez vous connecter en tant que client' });
            }

            const { adresseLivraison, notes } = req.body;
            const cart = req.session.cart || [];

            if (cart.length === 0) {
                return res.status(400).json({ success: false, message: 'Panier vide' });
            }

            // Generate unique command ID
            const lastCommande = await Commande.findOne().sort({ id_commande: -1 });
            const nextId = lastCommande ? lastCommande.id_commande + 1 : 1;

            const montantTotal = cart.reduce((sum, item) => {
                return sum + (parseFloat(item.prix) * parseInt(item.quantite));
            }, 0);

            // Create command according to your model
            const commande = new Commande({
                id_commande: nextId,
                dateCommande: new Date(),
                montantTotal: montantTotal,
                statut: "EN_ATTENTE",
                client: req.user.id, // Use req.user.id from JWT
                plats: cart.map(item => item.itemId)
            });

            await commande.save();
            
            // Clear the cart after successful order
            req.session.cart = [];
            
            res.json({ 
                success: true, 
                message: 'Commande passée avec succès!',
                commandeId: commande._id 
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, message: 'Erreur lors de la commande' });
        }
    },

    confirmation: (req, res) => {
        // Use req.user (from JWT)
        if (!req.user || req.user.role !== "Client") {
            return res.redirect('/login');
        }
        res.render('client/confirmation', { 
            commandeId: req.query.id 
        });
    },

    orderHistory: async (req, res) => {
        try {
            // Use req.user (from JWT)
            if (!req.user || req.user.role !== "Client") {
                return res.redirect('/login');
            }

            const commandes = await Commande.find({ client: req.user.id })
                .populate('plats')
                .sort({ dateCommande: -1 });

            res.render('client/order-history', {
                commandes
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).render('error', { message: 'Erreur lors du chargement de l\'historique' });
        }
    },

    orderDetails: async (req, res) => {
        try {
            // Use req.user (from JWT)
            if (!req.user || req.user.role !== "Client") {
                return res.redirect('/login');
            }

            const commande = await Commande.findById(req.params.id)
                .populate('plats')
                .populate('client');

            if (!commande) {
                return res.status(404).render('error', { message: 'Commande non trouvée' });
            }

            // Vérifier que la commande appartient bien au client connecté
            if (commande.client._id.toString() !== req.user.id) {
                return res.status(403).render('error', { message: 'Accès non autorisé' });
            }

            res.render('client/order-details', {
                commande
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).render('error', { message: 'Erreur lors du chargement des détails' });
        }
    },

    searchRestaurants: async (req, res) => {
        try {
            const { q, cuisine } = req.query;
            let query = { statut: "valide" };

            if (q) {
                query.nomRestaurant = { $regex: q, $options: 'i' };
            }

            const restaurants = await Restaurant.find(query);
            
            res.render('client/restaurants', {
                restaurants,
                searchQuery: q,
                cuisineFilter: cuisine
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).render('error', { message: 'Erreur lors de la recherche' });
        }
    },

    getCartCount: (req, res) => {
        const count = req.session.cart ? 
            req.session.cart.reduce((total, item) => total + parseInt(item.quantite), 0) : 0;
        
        res.json({ success: true, count });
    },

    profile: async (req, res) => {
        try {
            // Use req.user (from JWT)
            if (!req.user || req.user.role !== "Client") {
                return res.redirect('/login');
            }
            
            // Get client data from database
            const client = await Client.findById(req.user.id);
            
            res.render('client/profile', {
                client: client // Pass client data to view
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).render('error', { message: 'Erreur lors du chargement du profil' });
        }
    },

    updateProfile: async (req, res) => {
        try {
            // Use req.user (from JWT)
            if (!req.user || req.user.role !== "Client") {
                return res.status(401).json({ success: false, message: 'Non autorisé' });
            }

            const { username, email } = req.body;
            
            // Update user in database
            const updatedUser = await User.findByIdAndUpdate(
                req.user.id,
                { username, email },
                { new: true }
            );

            res.json({ 
                success: true, 
                message: 'Profil mis à jour avec succès',
                user: updatedUser 
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du profil' });
        }
    }
};

module.exports = ClientController;