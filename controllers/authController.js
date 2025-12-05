const User = require("../models/User");         
const Client = require("../models/Client");     
const Livreur = require("../models/Livreur");   
const Admin = require("../models/Admin");       
const Restaurant = require("../models/Restaurant");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    const { username, email, password, role, nomRestaurant } = req.body;

    // Check if email already exists
    const exist = await User.findOne({ email });
    if (exist) {
      return res.render("signup", { 
        error: "Email déjà utilisé",
        formData: req.body
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    let newUser;

    switch (role) {
      case "Client":
        newUser = new Client({ 
          username, 
          email, 
          password: hashedPassword, 
          statut: "en_attente" 
        });
        break;

      case "Livreur":
        newUser = new Livreur({ 
          username, 
          email, 
          password: hashedPassword, 
          statut: "en_attente" 
        });
        break;

      case "Restaurant":
        if (!nomRestaurant) {
          return res.render("signup", { 
            error: "Nom du restaurant obligatoire",
            formData: req.body
          });
        }
        newUser = new Restaurant({ 
          username, 
          email, 
          password: hashedPassword, 
          nomRestaurant, 
          statut: "en_attente" 
        });
        break;

      case "Admin":
        newUser = new Admin({ 
          username, 
          email, 
          password: hashedPassword, 
          statut: "valide" 
        });
        break;
        
      default:
        return res.render("signup", { 
          error: "Rôle invalide",
          formData: req.body
        });
    }

    await newUser.save();

    // Redirect to login
    return res.redirect("/login?message=Compte créé avec succès. Vous pourrez vous connecter une fois validé.");

  } catch (error) {
    console.error("Signup error:", error);
    return res.render("signup", { 
      error: "Erreur serveur lors de l'inscription",
      formData: req.body
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.render("login", { 
        error: "Email ou mot de passe incorrect",
        query: req.query
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("login", { 
        error: "Email ou mot de passe incorrect",
        query: req.query
      });
    }

    // Check account status
    if (user.role !== "Client" && user.statut === "en_attente") {
      return res.render("login", { 
        error: "Votre compte est en attente de validation par l'administrateur",
        query: req.query
      });
    }

    if (user.statut === "bloque") {
      return res.render("login", { 
        error: "Votre compte est bloqué",
        query: req.query
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role,
        statut: user.statut
      },
      process.env.JWT_SECRET || "SECRET",
      { expiresIn: "1d" }
    );

    // Store token in cookie
    res.cookie("token", token, { 
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    // Determine where to redirect
    let redirectTo = req.session?.returnTo || req.query.redirect;
    
    // Clear the session returnTo
    if (req.session) {
      delete req.session.returnTo;
    }
    
    // If no specific redirect, use default based on role
    if (!redirectTo) {
      switch(user.role) {
        case "Admin":
          redirectTo = "/admin/dashboard";
          break;
        case "Client":
          redirectTo = "/client/home-private";
          break;
        case "Livreur":
          redirectTo = "/livreur/dashboard";
          break;
        case "Restaurant":
          redirectTo = "/restaurant/home";
          break;
        default:
          redirectTo = "/";
      }
    }
    
    console.log(`✅ Login successful: ${user.username} (${user.role}) -> ${redirectTo}`);
    return res.redirect(redirectTo);

  } catch (err) {
    console.error("Login error:", err);
    return res.render("login", { 
      error: "Une erreur est survenue lors de la connexion",
      query: req.query
    });
  }
};