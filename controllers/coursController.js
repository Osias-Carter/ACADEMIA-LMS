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
        console.log("Insertion cours, values =", values);

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

// ✅ CORRECTION - Requête simplifiée avec alias explicite
module.exports.getCoursProf = (req, res) => {
    const users_id = req.session.user.id;

    const sql = `
        SELECT 
            c.id, 
            c.titre_cours, 
            c.desc_cours, 
            c.prix, 
            c.duree_minutes, 
            c.date_publication, 
            COALESCE(c.note_moyenne, 0) AS note_moyenne, 
            COALESCE(c.total_etudiants, 0) AS total_etudiants,
            c.niveau_id,
            n.nom AS niveau_nom
        FROM cours c
        JOIN niveau n ON c.niveau_id = n.id
        WHERE c.users_id = ?
        ORDER BY c.date_publication DESC
    `;
    
    db.query(sql, [users_id], (err, results) => {
        if (err) {
            console.error('❌ Erreur getCoursProf:', err);
            return res.status(500).json({ success: false, message: 'Erreur BDD cours' });
        }
        
        // 🐛 DEBUG - Afficher les résultats complets
        console.log('✅ Cours prof SQL:', results);
        console.log('📋 Premier cours complet:', JSON.stringify(results[0], null, 2));
        
        res.json({ success: true, cours: results });
    });
};

module.exports.deleteCours = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM cours WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Cours non trouvé' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('❌ Erreur deleteCours:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports.getAllCours = (req, res) => {
    console.log('📊 API /cours-list appelée');
    
    const sql = `
        SELECT 
            c.id, 
            c.titre_cours, 
            c.desc_cours, 
            c.prix, 
            c.duree_minutes,
            c.date_publication, 
            COALESCE(c.note_moyenne, 0) AS note_moyenne, 
            COALESCE(c.total_etudiants, 0) AS total_etudiants,
            u.nom AS nom_professeur,
            u.prenom AS prenom_professeur,
            n.nom AS niveau_nom,
            0 AS inscrit
        FROM cours c
        JOIN users u ON c.users_id = u.id
        LEFT JOIN niveau n ON c.niveau_id = n.id
        ORDER BY c.date_publication DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Erreur getAllCours:', err);
            return res.status(500).json({ success: false, message: 'Erreur BDD' });
        }
        console.log('✅ Cours trouvés:', results.length);
        res.json({ success: true, cours: results });
    });
};
module.exports.inscriptionCours = (req, res) => {};