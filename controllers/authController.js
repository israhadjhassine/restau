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
        newUser = new Client({ username, email, password: hashedPassword });
        break;
      case "Livreur":
        newUser = new Livreur({ username, email, password: hashedPassword });
        break;
      case "Admin":
        newUser = new Admin({ username, email, password: hashedPassword });
        break;
      case "Restaurant":
        if (!nomRestaurant) return res.status(400).json({ error: "Nom restaurant obligatoire" });
        newUser = new Restaurant({ username, email, password: hashedPassword, nomRestaurant });
        
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
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Email ou mot de passe incorrect" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Email ou mot de passe incorrect" });

    const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY", { expiresIn: "1d" });
    res.json({ token, user });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};