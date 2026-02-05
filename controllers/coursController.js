const path = require('path');
const db = require('../config/db');

module.exports.showCours = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/professeur/cours.html'));
};

module.exports.getCategories = (req, res) => {
    console.log("Route getCategories appelée")
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
    console.log("Route getNiveaux appelée")
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
    console.log("📤 Route de création des cours appelée:");

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
        console.log("Insertion cours", values);

        db.query(insertSql, values, (insertErr, result) => {
            if (insertErr) {
                console.error("❌ Erreur SQL insert:", insertErr.code, insertErr.message);
                return res.redirect('/professeur/cours?error=server_error');
            }

            console.log("✅ Cours créé ID:", result.insertId);
            return res.redirect('/dashboard?success=cours_created');
        });
    });
};

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
        
        console.log('✅ Cours prof SQL:', results);
        console.log('📋 Premier cours:', JSON.stringify(results[0], null, 2));
        
        res.json({ success: true, cours: results });
    });
};

module.exports.getCoursEtudiant = (req, res) => {
    const users_id = req.session.user.id;

    const sql = `
        SELECT 
            i.id AS inscription_id,
            i.date_completion AS date_completion, 
            i.date_inscription AS date_inscription, 
            COALESCE(i.pourcentage_progression, 0) AS pourcentage_progression
        FROM inscriptions i
        JOIN cours c ON i.cours_id = c.id
        WHERE i.users_id = ?
        ORDER BY i.date_inscription DESC
    `;
    
    db.query(sql, [users_id], (err, results) => {
        if (err) {
            console.error('❌ Erreur getCoursEtudiant:', err);
            return res.status(500).json({ success: false, message: 'Erreur BDD cours' });
        }
        
        console.log('✅ Cours Etudiant SQL:', results);
        console.log('📋 Premier cours:', JSON.stringify(results[0], null, 2));
        
        res.json({ success: true, inscriptions: results });
    });
};


    module.exports.updateCours = (req, res) => {
        const { id } = req.params;
        const users_id = req.session.user.id;
        
        const { 
        titre_cours, 
        desc_cours, 
        prix, 
        duree_minutes, 
        pre_requis, 
        categories_id, 
        niveau_id
    } = req.body;

        // Mettre à jour le cours
        const updateSql = `
            UPDATE cours 
            SET titre_cours = ?, 
                desc_cours = ?, 
                prix = ?, 
                duree_minutes = ?, 
                pre_requis = ?, 
                categories_id = ?, 
                niveau_id = ?
            WHERE id = ?
        `;

        const values = [titre_cours, desc_cours, prix, duree_minutes, pre_requis, categories_id, niveau_id, id];

        db.query(updateSql, values, (updateErr, result) => {
            if (updateErr) {
                console.error('❌ Erreur update cours:', updateErr);
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }

            console.log('✅ Cours mis à jour ID:', id, 'affectedRows:', result.affectedRows);
            res.json({ success: true, message: 'Cours mis à jour avec succès' });
        });
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


module.exports.inscriptionCours = (req, res) => {
    console.log("📥 Inscription appelée", req.body);
    
    if (!req.session.user || !req.session.user.id) {
        return res.status(401).json({ success: false, message: 'Non connecté' });
    }
    
    const users_id = req.session.user.id;
    const { cours_id } = req.body;
    
    if (!cours_id) {
        return res.status(400).json({ success: false, message: 'ID cours manquant' });
    }

    // Vérifier si déjà inscrit
    const checkSql = `SELECT id FROM inscriptions WHERE users_id = ? AND cours_id = ?`;
    db.query(checkSql, [users_id, cours_id], (err, results) => {
        if (err) {
            console.error('❌ Erreur check inscription:', err);
            return res.status(500).json({ success: false, message: 'Erreur BDD' });
        }
        
        if (results.length > 0) {
            return res.json({ success: false, message: 'Déjà inscrit à ce cours' });
        }
        
        // Insérer inscription
        const insertSql = `INSERT INTO inscriptions (date_inscription, date_completion, pourcentage_progression, users_id, cours_id) 
                          VALUES (NOW(), NULL, 0, ?, ?)`;
        db.query(insertSql, [users_id, cours_id], (err, result) => {
            if (err) {
                console.error('❌ Erreur insert inscription:', err);
                return res.status(500).json({ success: false, message: 'Erreur inscription' });
            }
            console.log('✅ Inscrit:', users_id, '→ cours:', cours_id);
            res.json({ success: true, message: 'Inscription réussie !' });
        });
    });
};

// Corriger deleteCours et updateCours avec vérification propriétaire
module.exports.deleteCours = (req, res) => {
    const { id } = req.params;
    const users_id = req.session.user?.id;
    
    if (!users_id) return res.status(401).json({ success: false, message: 'Non connecté' });

    const checkSql = 'SELECT id FROM cours WHERE id = ? AND users_id = ?';
    db.query(checkSql, [id, users_id], (err, results) => {
        if (err || !results.length) {
            return res.status(403).json({ success: false, message: 'Accès refusé' });
        }
        
        const deleteSql = 'DELETE FROM cours WHERE id = ?';
        db.query(deleteSql, [id], (deleteErr) => {
            if (deleteErr) {
                console.error('❌ Erreur delete:', deleteErr);
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }
            res.status(204).send();
        });
    });
};
