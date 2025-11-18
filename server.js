const express = require("express");
const connectDB = require("./config/db");

// Initialisation
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion MongoDB
connectDB();

// Import des modèles (important : cela crée automatiquement les collections)
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

app.get("/", (req, res) => {
  res.send("Base de données créée et modèles chargés !");
});

const path = require("path");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//app.use("/users", require("./routes/userRoutes"));
//app.use("/restaurant", require("./routes/restaurantRoutes"));
app.use("", require("./routes/authRoute"));

// Lancement du serveur
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
