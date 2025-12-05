// server.js - COMPLETE CORRECTED VERSION
require('dotenv').config();

const express = require("express");
const connectDB = require("./config/db");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const path = require("path");

// Initialisation
const app = express();

// Body parsers (must be before routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || "session_secret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // true only if HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Connexion MongoDB
connectDB();

// Import des modèles (just require so mongoose schemas are registered)
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

// ---------------- JWT Authentication Middleware ----------------
app.use((req, res, next) => {
  const token = req.cookies?.token;
  
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "SECRET";
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      console.log(`✅ User authenticated: ${decoded.username} (${decoded.role})`);
    } catch (err) {
      console.log("❌ JWT invalid:", err.message);
      req.user = null;
      res.clearCookie("token");
    }
  } else {
    req.user = null;
  }
  
  next();
});

// ---------------- Make user available in ALL views ----------------
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// ---------------- Debug middleware ----------------
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`  User: ${req.user?.username || 'Guest'} (${req.user?.role || 'none'})`);
  console.log(`  Session ID: ${req.sessionID}`);
  console.log(`  Cart items: ${req.session?.cart?.length || 0}`);
  console.log('---');
  next();
});

// Views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files (if you have any)
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("", require("./routes/authRoute"));
app.use("/client", require("./routes/client"));
app.use("/restaurant", require("./routes/restaurantRoutes"));
app.use("/admin", require("./routes/adminRoutes"));
app.use("/livreur", require("./routes/livreur"));

// Route racine
app.get("/", (req, res) => res.redirect("/client/home-public"));

// ---------------- Debug routes ----------------
app.get("/debug", (req, res) => {
  const token = req.cookies?.token;
  let decodedUser = null;
  let error = null;
  
  if (token) {
    try {
      decodedUser = jwt.verify(token, process.env.JWT_SECRET || "SECRET");
    } catch (err) {
      error = err.message;
      decodedUser = { error: error };
    }
  }
  
  res.json({
    user: req.user,
    localsUser: res.locals.user,
    session: {
      id: req.sessionID,
      cart: req.session?.cart || [],
      cartLength: req.session?.cart?.length || 0
    },
    cookies: {
      token: token ? "Present" : "Absent",
      tokenLength: token ? token.length : 0
    },
    env: {
      JWT_SECRET: process.env.JWT_SECRET ? "✓ Set" : "✗ Not set",
      SESSION_SECRET: process.env.SESSION_SECRET ? "✓ Set" : "✗ Not set"
    },
    verificationError: error
  });
});


app.get("/debug/user", (req, res) => {
  res.json({
    user: req.user,
    hasUser: !!req.user,
    username: req.user?.username,
    role: req.user?.role,
    statut: req.user?.statut
  });
});

// Test cart route (for debugging)
app.post("/test-cart", (req, res) => {
  console.log("✅ Test cart route hit!");
  console.log("Request body:", req.body);
  console.log("Session ID:", req.sessionID);
  console.log("Session cart:", req.session?.cart || []);
  
  // Initialize cart if needed
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  
  res.json({ 
    success: true, 
    message: "Test item added",
    cart: req.session.cart 
  });
});



// 404 handler
app.use((req, res, next) => {
  res.status(404).render('error', { 
    message: 'Page non trouvée' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server error:', err.stack);
  res.status(500).render('error', { 
    message: 'Erreur serveur interne' 
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
Serveur lancé sur http://localhost:${PORT}   
JWT_SECRET: ${process.env.JWT_SECRET ? '✓ Loaded' : '✗ Missing'}         ║
SESSION_SECRET: ${process.env.SESSION_SECRET ? '✓ Loaded' : '✗ Missing'}   ║
MongoDB: Connected                  
Environment: ${process.env.NODE_ENV || 'development'}           ║

  `);
});