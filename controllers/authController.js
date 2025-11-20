const User = require("../models/User");         
const Client = require("../models/Client");     
const Livreur = require("../models/Livreur");   
const Admin = require("../models/Admin");       
const Restaurant = require("../models/Restaurant");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Signup
exports.signup = async (req, res) => {
  try {
    const { username, email, password, role, nomRestaurant } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ error: "Email déjà utilisé" });

    const hashedPassword = await bcrypt.hash(password, 10);
    let newUser;

    switch(role) {
      case "Client":
        newUser = new Client({ username, email, password: hashedPassword, statut: "en_attente" });
        break;
      case "Livreur":
        newUser = new Livreur({ username, email, password: hashedPassword, statut: "en_attente" });
        break;
      case "Admin":
        newUser = new Admin({ username, email, password: hashedPassword, statut: "valide" });
        break;
        
        
      case "Restaurant":
        if (!nomRestaurant) return res.status(400).json({ error: "Nom restaurant obligatoire" });
        newUser = new Restaurant({ username, email, password: hashedPassword, nomRestaurant, statut: "en_attente" });
        
        break;
      default:
        return res.status(400).json({ error: "Rôle invalide" });
    }

    await newUser.save();
    res.status(201).json({ message: "Compte créé", user: newUser });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};

// Login
/*exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });

    // Vérifier si le compte est validé
    if (user.statut === "en_attente")
      return res.status(403).json({ error: "Votre compte est en attente de validation." });

    if (user.statut === "bloque")
      return res.status(403).json({ error: "Votre compte est bloqué." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      "SECRET_KEY",
      { expiresIn: "1d" }
    );

    res.json({ token, user });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};*/



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });

    // Vérifier si le compte est validé
    if (user.statut === "en_attente")
      return res.status(403).json({ error: "Votre compte est en attente de validation." });

    if (user.statut === "bloque")
      return res.status(403).json({ error: "Votre compte est bloqué." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });

  


     const token = jwt.sign({ id: user._id, role: user.role }, "SECRET", { expiresIn: "1d" });

    // 🔹 Stocker JWT dans un cookie
    res.cookie("token", token, { httpOnly: true });


    // 🔹 Ajouter la redirection selon rôle
    let redirect = "";
    if (user.role === "Admin") return res.redirect ("/admin/dashboard");
    else if (user.role === "Client") return res.redirect ("/client/home");
    else if (user.role === "Livreur") return res.redirect("/livreur/dashboard");

    else if (user.role === "Restaurant") return res.redirect  ("/restaurant/home");


  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



