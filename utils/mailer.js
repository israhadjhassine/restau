const nodemailer = require("nodemailer");

// Configuration du transporteur
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "laffetnourelhouda@gmail.com", // ton email
    pass: "dekk stoc hmnm irdb", // mot de passe d'application
  },
});

// Fonction d'envoi d'email
exports.sendEmail = async (to, subject, text, html = null) => {
  try {
    await transporter.sendMail({
      from: `"Livraison App" <laffetnourelhouda@gmail.com>`,
      to,          // destinataire
      subject,     // sujet de l'email
      text,        // texte simple
      html,        // contenu HTML optionnel
    });

    console.log("📧 Email envoyé à : " + to);
  } catch (error) {
    console.error("Erreur envoi email :", error);
  }
};
