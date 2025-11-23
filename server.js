const express = require("express");
const connectDB = require("./config/db");
const session = require("express-session");
const jwt = require("jsonwebtoken"); // Add this import

// Initialisation
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion MongoDB
connectDB();

// Import des modèles
require("./models/User");
require("./models/Admin");
require("./models/Client");
require("./models/Livreur");
require("./models/Restaurant");
require("./models/Menu");
require("./models/Plat");
require("./models/Commande");
require("./models/Paiement");
require("./models/Reclamation");

const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Session middleware
app.use(session({
  secret: "your-secret-key",
  resave: true, // Change to true for better session handling
  saveUninitialized: false, // Change to false for better security
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ⭐⭐⭐ ADD JWT MIDDLEWARE (what your friends use) ⭐⭐⭐
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, "SECRET");
      req.user = decoded; // For route authentication
      res.locals.user = decoded; // For views (EJS templates)
      console.log("JWT User authenticated:", decoded);
    } catch (err) {
      console.log("JWT Token invalid");
      req.user = null;
      res.locals.user = null;
    }
  } else {
    req.user = null;
    res.locals.user = null;
  }
  next();
});

// Debug middleware (optional - you can remove this later)
app.use((req, res, next) => {
  console.log('=== DEBUG ===');
  console.log('Session user:', req.session.user);
  console.log('JWT user:', req.user);
  console.log('URL:', req.url);
  console.log('=============');
  next();
});

const path = require("path");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const authMiddleware = require("./middleware/auth");

// Routes publiques FIRST
app.use("", require("./routes/authRoute"));
app.use("/client", require("./routes/client")); // Public client routes

// Routes protégées
app.use("/restaurant", authMiddleware, require("./routes/restaurantRoutes"));
app.use("/admin", authMiddleware, require("./routes/adminRoutes"));
app.use("/livreur", require("./routes/livreur"));

// Root route - redirect based on login status and role
app.get("/", (req, res) => {
  // ⭐⭐⭐ FIXED: Always redirect to PUBLIC home by default ⭐⭐⭐
  res.redirect("/client/home-public");
});

// Lancement du serveur
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});