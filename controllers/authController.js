const bcrypt = require("bcrypt");
const path = require("path");
const saltRounds = 10;
const db = require("../config/db");

// Afficher les formulaires
module.exports.showRegister = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/register.html"));
};
module.exports.showPregister = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/pregister.html"));
};
module.exports.showLogin = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/login.html"));
};
module.exports.showPlogin = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/plogin.html"));
};
module.exports.showDashboard = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard.html"));
};

// UTILS
function getUserIdField(user) {
  // Retourne la propriété id correcte quel que soit le nom de la colonne
  return user.id ?? user.id_user ?? user.ID ?? user.Id;
}

// Inscription étudiant
module.exports.register = async (req, res) => {
  console.log("Route register POST appelée");
  let { nom, prenom, email, password, tel } = req.body;
  console.log("Données reçues:", { nom, prenom, email, tel });

  try {
    const checkSql = "SELECT * FROM users WHERE email = ?";
    db.query(checkSql, [email], async (err, results) => {
      if (err) {
        console.error("Erreur SQL check:", err);
        return res.redirect("/register?error=server_error");
      }
      if (results.length > 0) {
        console.log("Email déjà utilisé:", email);
        return res.redirect("/register?error=email_exists");
      }

      try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log("Mot de passe hashé");

        const insertSql = `
          INSERT INTO users (nom, prenom, email, password, tel, roles_id)
          VALUES (?, ?, ?, ?, COALESCE(?, ''), 1)
        `;
        // Passer exactement 5 paramètres pour les placeholders
        db.query(
          insertSql,
          [nom, prenom, email, hashedPassword, tel],
          (err, result) => {
            if (err) {
              console.error("Erreur SQL insert:", err);
              return res.redirect("/register?error=server_error");
            }
            console.log("✅ Utilisateur créé:", result.insertId);
            req.session.user = {
              id: result.insertId,
              nom,
              prenom,
              email,
              tel,
              roles_id: 1,
            };
            return res.redirect("/dashboard");
          }
        );
      } catch (hashError) {
        console.error("Erreur hash:", hashError);
        return res.redirect("/register?error=server_error");
      }
    });
  } catch (error) {
    console.error("Erreur générale:", error);
    return res.redirect("/register?error=server_error");
  }
};

// Inscription professeur
module.exports.pregister = async (req, res) => {
  console.log("Route pregister POST appelée");
  let { nom, prenom, email, password, tel } = req.body;
  nom = (nom || "").trim();
  prenom = (prenom || "").trim();
  email = (email || "").trim();
  password = (password || "").toString();

  try {
    const checkSql = "SELECT * FROM users WHERE email = ?";
    db.query(checkSql, [email], async (err, results) => {
      if (err) {
        console.error("Erreur SQL check:", err);
        return res.redirect("/pregister?error=server_error");
      }
      if (results.length > 0) {
        console.log("Email déjà utilisé:", email);
        return res.redirect("/pregister?error=email_exists");
      }

      try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log("Mot de passe hashé (prof)");

        const insertSql = `
          INSERT INTO users (nom, prenom, email, password, tel, roles_id)
          VALUES (?, ?, ?, ?, COALESCE(?, ''), 2)
        `;
        db.query(
          insertSql,
          [nom, prenom, email, hashedPassword, tel],
          (err, result) => {
            if (err) {
              console.error("Erreur SQL insert:", err);
              return res.redirect("/pregister?error=server_error");
            }
            console.log("✅ Prof créé:", result.insertId);
            req.session.user = {
              id: result.insertId,
              nom,
              prenom,
              email,
              tel,
              roles_id: 2,
            };
            return res.redirect("/dashboard");
          }
        );
      } catch (hashError) {
        console.error("Erreur hash:", hashError);
        return res.redirect("/pregister?error=server_error");
      }
    });
  } catch (error) {
    console.error("Erreur générale:", error);
    return res.redirect("/pregister?error=server_error");
  }
};

// Connexion étudiant
module.exports.login = async function (req, res) {
  console.log("Route de login appelée");


  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Erreur SQL:", err);
      return res.redirect("/login?error=server_error");
    }
    if (results.length === 0) {
      console.log("Email non trouvé");
      return res.redirect("/login?error=email_not_found");
    }

    const user = results[0];
    console.log("Hash stocké pour l'utilisateur:", user.password);

    try {
      const validPassword = await bcrypt.compare(password, user.password);
      console.log(password, user.password);
      console.log("bcrypt.compare =>", validPassword);

      if (!validPassword) {
        console.log("Mot de passe incorrect");
        return res.redirect("/login?error=invalid_password");
      }

      // Créer la session correctement en utilisant 'user'
      req.session.user = {
        id: getUserIdField(user),
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        tel: user.tel,
        roles_id: user.roles_id ?? 1,
      };
      return res.redirect("/dashboard");
    } catch (compareErr) {
      console.error("Erreur lors du compare bcrypt:", compareErr);
      return res.redirect("/login?error=server_error");
    }
  });
};

// Connexion professeur
module.exports.plogin = async function (req, res) {
  console.log("Route de plogin appelée");
  const email = (req.body.email || "").trim();
  const password = (req.body.password || "").toString();

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Erreur SQL:", err);
      return res.redirect("/plogin?error=server_error");
    }
    if (results.length === 0) {
      return res.redirect("/plogin?error=email_not_found");
    }

    const user = results[0];
    console.log("Hash stocké pour le prof:", user.password);

    try {
      const validPassword = await bcrypt.compare(password, user.password);
      console.log("bcrypt.compare (prof) =>", validPassword);

      if (!validPassword) {
        return res.redirect("/plogin?error=invalid_password");
      }

      req.session.user = {
        id: getUserIdField(user),
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        tel: user.tel,
        roles_id: user.roles_id ?? 2,
      };
      return res.redirect("/dashboard");
    } catch (compareErr) {
      console.error("Erreur lors du compare bcrypt:", compareErr);
      return res.redirect("/plogin?error=server_error");
    }
  });
};
