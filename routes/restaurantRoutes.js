const express = require("express");
const Restaurant = require("../models/Restaurant");
const Plat = require("../models/Plat");

const router = express.Router();

// Ajouter un restaurant
router.post("/", async (req, res) => {
    try {
        const restaurant = new Restaurant(req.body);
        await restaurant.save();
        res.status(201).json(restaurant);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Récupérer tous les restaurants
router.get("/", async (req, res) => {
    const restaurants = await Restaurant.find().populate("menu");
    res.json(restaurants);
});

// Ajouter un plat à un restaurant
router.post("/:id/plats", async (req, res) => {
    try {
        const plat = new Plat(req.body);
        await plat.save();
        const restaurant = await Restaurant.findById(req.params.id);
        restaurant.menu.push(plat._id);
        await restaurant.save();
        res.json({ restaurant, plat });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
