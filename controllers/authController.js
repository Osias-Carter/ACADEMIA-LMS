const bcrypt = require("bcrypt");
const path = require("path");
const saltRounds = 10;
const db = require("../config/db");

// Afficher les formulaires
module.exports.showRegister = (req, res) => {
    res.sendFile(path.join(__dirname, "../views/user/register.html"));
};

module.exports.showPregister = (req, res) => {
    res.sendFile(path.join(__dirname, "../views/professeur/pregister.html"));
};

module.exports.showLogin = (req, res) => {
    res.sendFile(path.join(__dirname, "../views/user/login.html"));
};

module.exports.showPlogin = (req, res) => {
    res.sendFile(path.join(__dirname, "../views/professeur/plogin.html"));
};

module.exports.showDashboard = (req, res) => {
    res.sendFile(path.join(__dirname, "../views/dashboard.html"));
};

// REGISTER ÉTUDIANT
module.exports.register = (req, res) => {
    console.log("Route register appelée");
    const { nom, prenom, email, password, tel } = req.body;

    const checkSql = "SELECT * FROM users WHERE email = ?";
    db.query(checkSql, [email], (err, results) => {
        if (err) {
            console.error("Erreur SQL check:", err);
            return res.redirect("/user/register?error=server_error");
        }
        if (results.length > 0) {
            console.log("Email déjà utilisé:", email);
            return res.redirect("/user/register?error=email_exists");
        }

        bcrypt.hash(password, saltRounds, (hashErr, hashedPassword) => {
            if (hashErr) {
                console.error("Erreur hash:", hashErr);
                return res.redirect("/user/register?error=server_error");
            }

            const insertSql = `
                INSERT INTO users (nom, prenom, email, password, tel, joined_at, roles_id)
                VALUES (?, ?, ?, ?, ?, NOW(), 1)
            `;
            db.query(insertSql, [nom, prenom, email, hashedPassword, tel || ''], (insertErr, result) => {
                if (insertErr) {
                    console.error("Erreur SQL insert:", insertErr);
                    return res.redirect("/user/register?error=server_error");
                }
                console.log("✅ Étudiant créé:", result.insertId);
                res.redirect("/user/login");
            });
        });
    });
};

// PREGISTER PROFESSEUR
module.exports.pregister = (req, res) => {
    console.log("Route pregister appelée");
    const { nom, prenom, email, password, tel } = req.body;

    const checkSql = "SELECT * FROM users WHERE email = ?";
    db.query(checkSql, [email], (err, results) => {
        if (err) {
            console.error("Erreur SQL check:", err);
            return res.redirect("/professeur/pregister?error=server_error");
        }
        if (results.length > 0) {
            console.log("Email déjà utilisé:", email);
            return res.redirect("/professeur/pregister?error=email_exists");
        }

        bcrypt.hash(password, saltRounds, (hashErr, hashedPassword) => {
            if (hashErr) {
                console.error("Erreur hash:", hashErr);
                return res.redirect("/professeur/pregister?error=server_error");
            }

            const insertSql = `
                INSERT INTO users (nom, prenom, email, password, tel, joined_at, roles_id)
                VALUES (?, ?, ?, ?, ?, NOW(), 2)
            `;
            db.query(insertSql, [nom, prenom, email, hashedPassword, tel || ''], (insertErr, result) => {
                if (insertErr) {
                    console.error("Erreur SQL insert:", insertErr);
                    return res.redirect("/professeur/pregister?error=server_error");
                }
                console.log("✅ Prof créé:", result.insertId);
                res.redirect("/professeur/plogin");
            });
        });
    });
};

// LOGIN ÉTUDIANT
module.exports.login = async (req, res) => {
    console.log("Route login appelée");
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error("Erreur SQL:", err);
            return res.redirect("/user/login?error=server_error");
        }
        if (results.length === 0) {
            console.log("Email non trouvé");
            return res.redirect("/user/login?error=email_not_found");
        }

        const user = results[0];
        const isPasswordMatch = await bcrypt.compare(password, user.password);


        if (!isPasswordMatch) {
            console.log('Mot de passe incorrect');
            return res.redirect("/user/login?error=invalid_password");
        }
        
        req.session.user = {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            tel: user.tel || '',
            joined_at: user.joined_at,
            roles_id: user.roles_id || 1
        };
        console.log("✅ Login étudiant réussi");
        console.log("SESSION", req.session.user);
        res.redirect("/dashboard?message=success");
    });
};

// PLOGIN PROFESSEUR
module.exports.plogin = async (req, res) => {
    console.log("Route plogin appelée");
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error("Erreur SQL:", err);
            return res.redirect("/professeur/plogin?error=server_error");
        }
        if (results.length === 0) {
            return res.redirect("/professeur/plogin?error=email_not_found");
        }

        const user = results[0];
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            console.log('Mot de passe incorrect');
            return res.redirect("/professeur/plogin?error=invalid_password");
        }
        
        req.session.user = {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            tel: user.tel || '',
            joined_at: user.joined_at,
            roles_id: user.roles_id || 2
        };
        res.redirect("/dashboard");
        console.log("✅ Login prof réussi");
        console.log("SESSION", req.session.user);
    });
};

// Info du user
module.exports.getUserInfo = (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Non connecté' });
    }
    
    res.json({ 
        success: true, 
        user: req.session.user 
    });
};

// LOGOUT
module.exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Erreur lors de la déconnexion:", err);
            return res.status(500).json({ success: false, message: "Erreur serveur" });
        }
        res.json({ success: true, message: "Déconnexion réussie" });
        console.log("Déconnexion réussie")
    });
};

module.exports.updateUser = (req, res) => {
    const userId = req.session.user.id;
    const { nom, prenom, tel } = req.body;

    if (!nom || !prenom || !tel ) {
        return res.status(400).json({ success: false, message: "Tous les champs sont réquis" });
    }

    const sql = "UPDATE users SET nom = ?, prenom = ?, tel = ? WHERE id = ?";
    db.query(sql, [nom, prenom, tel, userId], (err, result) => {
        if (err) {
            console.error("❌ Erreur update user:", err);
            return res.status(500).json({ success: false, message: "Erreur serveur" });
        }
        
        // 💡 Important : Mettre à jour la session pour que les changements soient visibles partout
        req.session.user.nom = nom;
        req.session.user.prenom = prenom;
        req.session.user.tel = tel;

        res.json({ success: true, message: "Profil mis à jour !" });
    });
};