const path = require('path');
const db = require('../config/db');

module.exports.showCours = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/professeur/cours.html'));
};

module.exports.getCategories = (req, res) => {
    const sql = 'SELECT id, nom_cat, desc_cat FROM categories ORDER BY nom_cat';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Erreur catégories:', err);
            return res.status(500).json({ success: false, message: 'Erreur BDD catégories' });
        }
        res.json({ success: true, categories: results });
    });
};

module.exports.getNiveaux = (req, res) => {
    const sql = 'SELECT id, nom FROM niveau ORDER BY nom';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Erreur niveau:', err);
            return res.status(500).json({ success: false, message: 'Erreur BDD niveau' });
        }
        res.json({ success: true, niveaux: results });
    });
};

module.exports.cours = (req, res) => {
    console.log("📤 Route cours POST appelée:", req.body);
    console.log('SESSION USER AVANT INSERT:', req.session.user);

    const { 
        titre_cours, 
        desc_cours, 
        prix, 
        duree_minutes, 
        pre_requis, 
        categories_id, 
        niveau_id
    } = req.body;

    if (!req.session.user || !req.session.user.id) {
        return res.redirect('/user/login');
    }
    const users_id = req.session.user.id;

    const checkSql = "SELECT id FROM cours WHERE titre_cours = ?";
    db.query(checkSql, [titre_cours], (err, results) => {
        if (err) {
            console.error("❌ Erreur SQL check:", err);
            return res.redirect('/professeur/cours?error=server_error');
        }

        if (results.length > 0) {
            console.log("❌ Cours existe déjà:", titre_cours);
            return res.redirect('/professeur/cours?error=cours_exists');
        }

        const insertSql = `
            INSERT INTO cours (
                titre_cours, desc_cours, prix, duree_minutes, 
                date_publication, pre_requis, total_etudiants, 
                note_moyenne, categories_id, niveau_id, users_id
            ) VALUES (?, ?, ?, ?, NOW(), ?, 0, 0, ?, ?, ?)
        `;

        const values = [titre_cours, desc_cours, prix, duree_minutes, pre_requis, categories_id, niveau_id, users_id];
        console.log("🔄 Insertion cours, values =", values);

        db.query(insertSql, values, (insertErr, result) => {
            if (insertErr) {
                console.error("❌ Erreur SQL insert:", insertErr.code, insertErr.message);
                return res.redirect('/professeur/cours?error=server_error');
            }

            console.log("✅ Cours créé ID:", result.insertId);
            return res.redirect('/dashboard');
        });
    });
};

module.exports.getCoursProf = (req, res) => {
  
    const users_id = req.session.user.id;

    const sql = `
        SELECT id, titre_cours, desc_cours, prix, duree_minutes, 
               date_publication, note_moyenne, total_etudiants
        FROM cours
        WHERE users_id = ?
        ORDER BY date_publication DESC
    `;
    db.query(sql, [users_id], (err, results) => {
        if (err) {
            console.error('❌ Erreur getCoursProf:', err);
            return res.status(500).json({ success: false, message: 'Erreur BDD cours' });
        }
        res.json({ success: true, cours: results });
    });
};

