const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
 /* const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).send("Connectez-vous d'abord");*/

  const token = req.cookies?.token; // 🔹 récupérer depuis cookie
  if (!token) return res.redirect("/login");

  try {
    req.user = jwt.verify(token, "SECRET");
    next();
  } catch (err) {
    res.status(400).send("Token invalide");

    
  }
};