const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Get token from cookie
  const token = req.cookies?.token;
  
  if (!token) {
    // No token - redirect to login with return URL
    if (req.originalUrl !== '/login' && req.originalUrl !== '/signup') {
      req.session.returnTo = req.originalUrl;
    }
    return res.redirect("/login");
  }

  try {
    // Verify token
    const secret = process.env.JWT_SECRET || "SECRET";
    const decoded = jwt.verify(token, secret);
    
    // Attach user to request
    req.user = decoded;
    
    // Check account status based on role
    if (req.user.role !== "Client" && req.user.statut === "en_attente") {
      console.log(`Account ${req.user.username} (${req.user.role}) is pending approval`);
      res.clearCookie("token");
      return res.redirect("/login?error=Votre compte est en attente de validation");
    }
    
    if (req.user.statut === "bloque") {
      console.log(`Account ${req.user.username} is blocked`);
      res.clearCookie("token");
      return res.redirect("/login?error=Votre compte est bloqué");
    }
    
    console.log(`✅ Authenticated: ${req.user.username} (${req.user.role})`);
    next();
  } catch (err) {
    console.log("❌ JWT verification failed:", err.message);
    res.clearCookie("token");
    return res.redirect("/login?error=Session invalide ou expirée");
  }
};