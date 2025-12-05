const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/login", (req, res) => {
    res.render("login", { 
        error: req.query.error || "",
        message: req.query.message || "",
        query: req.query 
    });
});

router.get("/signup", (req, res) => {
    res.render("signup", { 
        error: req.query.error || "",
        formData: {}
    });
});

router.get("/logout", (req, res) => {
    // Clear token cookie
    res.clearCookie("token");
    
    // Destroy session
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect("/login?message=Déconnecté avec succès");
    });
});

router.post("/signup", authController.signup);
router.post("/login", authController.login);

module.exports = router;