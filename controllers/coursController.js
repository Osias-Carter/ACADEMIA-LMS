const path = require('path');
const db = require('../config/db');
const multer = require('multer');

// Config uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/cours/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });


module.exports.showCours = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/professeur/cours.html'));
};

module.exports.getCategories = (req, res) => {
    console.log("Route de récupération des categories  appelée")
    const sql = 'SELECT id, nom_cat, desc_cat FROM categories ORDER BY nom_cat';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(' Erreur  de récupération des catégories:', err);
            return res.status(500).json({ success: false, message: 'Erreur  de récupération des catégories' });
        }
        res.json({ success: true, categories: results });
    });
};

module.exports.getNiveaux = (req, res) => {
    console.log("Route de récupération des niveaux  appelée")
    const sql = 'SELECT id, nom FROM niveau ORDER BY nom';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erreur de récupération des niveaux:', err);
            return res.status(500).json({ success: false, message: 'Erreur de récupération des niveaux' });
        }
        res.json({ success: true, niveaux: results });
    });
};

module.exports.cours = [
    upload.fields([
        { name: 'urlvideo', maxCount: 1 },
        { name: 'urlpdf', maxCount: 1 }
    ]),
    (req, res) => {
        console.log("Route de création des cours  appelée :");

        const { 
            titre_cours, 
            desc_cours, 
            prix, 
            duree_minutes, 
            pre_requis, 
            categories_id, 
            niveau_id,
            contenu_texte  // ← NOUVEAU
        } = req.body;

        // Chemins fichiers uploadés
        const urlvideo = req.files['urlvideo'] ? req.files['urlvideo'][0].path : '';
        const urlpdf = req.files['urlpdf'] ? req.files['urlpdf'][0].path : '';

        const users_id = req.session.user.id;

        // Vérif doublon 
        const checkSql = "SELECT id FROM cours WHERE titre_cours = ?";
        db.query(checkSql, [titre_cours], (err, results) => {
            if (err) {
                console.error(" Erreur Serveur:", err);
                return res.redirect('/professeur/cours?error=server_error');
            }
            if (results.length > 0) {
                console.log("Ce cours existe déjà:", titre_cours);
                return res.redirect('/professeur/cours?error=cours_exists');
            }

            // ✅ INSERT AVEC FICHIERS
            const insertSql = `
                INSERT INTO cours (
                    titre_cours, desc_cours, prix, duree_minutes,
                    date_publication, pre_requis, total_etudiants, 
                    note_moyenne, categories_id, niveau_id, users_id,
                    urlvideo, urlpdf, contenu_texte
                ) VALUES (?, ?, ?, ?, NOW(), ?, 0, 0, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                titre_cours, desc_cours, prix, duree_minutes, 
                pre_requis, categories_id, niveau_id, users_id,
                urlvideo, urlpdf, contenu_texte
            ];


            console.log("Insertion cours :", values);

            db.query(insertSql, values, (insertErr, result) => {
                if (insertErr) {
                    console.error(" Erreur de création du cours:", insertErr.code, insertErr.message);
                    return res.redirect('/professeur/cours?error=server_error');
                }
                console.log("✅ Cours créé ID:", result.insertId);
                return res.redirect('/dashboard?success=cours_created');
            });
        });
    }
];


module.exports.getCoursProf = (req, res) => {
    const users_id = req.session.user.id;
    console.log("Route de récupération des cours par prof ")

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
            console.error('Erreur de récupération des cours par prof:', err);
            return res.status(500).json({ success: false, message: 'Erreur BDD cours' });
        }
        
        // console.log('✅ Cours prof SQL:', results);
        // console.log('📋 Premier cours:', JSON.stringify(results[0], null, 2));
        
        res.json({ success: true, cours: results });
    });
};

module.exports.getCoursEtudiant = (req, res) => {
    const users_id = req.session.user.id;
    console.log("Route de récupération des cours par étudiant appellée ")
    const sql = `
        SELECT 
            i.id AS inscription_id,
            i.date_completion AS date_completion, 
            i.date_inscription AS date_inscription, 
            c.titre_cours,
            c.desc_cours,
            c.prix,
            c.note_moyenne,
            c.duree_minutes,
            COALESCE(i.pourcentage_progression, 0) AS pourcentage_progression
        FROM inscriptions i
        JOIN cours c ON i.cours_id = c.id
        WHERE i.users_id = ?
        ORDER BY i.date_inscription DESC
    `;
    
    // c.titre_cours,c.desc_cours,c.prix,c.pourcentage,c.note_moyenne,c.duree_minutes
    db.query(sql, [users_id], (err, results) => {
        if (err) {
            console.error(' Erreur de récupération des cours par étudiant:', err);
            return res.status(500).json({ success: false, message: 'Erreur BDD cours' });
        }
        
        // console.log('✅ Cours Etudiant SQL:', results);
        // console.log('📋 Premier cours:', JSON.stringify(results[0], null, 2));
        
        res.json({ success: true, inscriptions: results });
    });
};


module.exports.updateCours = (req, res) => {
        const { id } = req.params;
        const users_id = req.session.user.id;
        console.log("Route de mise à jour des cours appellée ")
        
        const { 
        titre_cours, 
        desc_cours, 
        prix, 
        duree_minutes, 
        pre_requis, 
        categories_id, 
        niveau_id,
        urlvideo,
        urlpdf,
        contenu_texte
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
                urlvideo = ?,
                urlpdf = ?,
                contenu_texte = ?
            WHERE id = ?
        `;

        const values = [titre_cours, desc_cours, prix, duree_minutes, pre_requis, categories_id, niveau_id, urlvideo, urlpdf, contenu_texte, id];

        db.query(updateSql, values, (updateErr, result) => {
            if (updateErr) {
                console.error(' Erreur de mise à jour du cours:', updateErr);
                return res.status(500).json({ success: false, message: 'Erreur serveur' });
            }

            console.log('✅ Cours mis à jour ID:', id, 'Ligne affectée:', result.affectedRows);
            res.json({ success: true, message: 'Cours mis à jour avec succès' });
        });
};
module.exports.getAllCours = (req, res) => {
    console.log('Route de récupération de tous les cours');
    
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
            console.error('Erreur de récupération des cours:', err);
            return res.status(500).json({ success: false, message: 'Erreur de récupération des cours' });
        }
        console.log('✅ Cours trouvés:', results.length);
        res.json({ success: true, cours: results });
    });
};
module.exports.getSingleCours = (req, res) => {
        console.log('Route de récupération d'+"un cours");
        const sql = `
        SELECT * FROM cours WHERE  id = ?`;

        const { id } = req.params;
        const users_id = req.session.user?.id;

        db.query(sql, [users_id, id], (err, results) => {
            if (err) {
                console.error(' Erreurde récupération du cours:', err);
                return res.status(500).json({ success: false, message: 'Erreur BDD' });
            }
            if (results.length === 0) {
                return res.status(404).json({ success: false, message: 'Tchiaaa Cours non trouvé' });
            }
            console.log('✅ Cours trouvé:', results[0]);
            res.json({ success: true, cours: results[0] });
            res.redirect("/dashboard");

        });
};

module.exports.inscriptionCours = (req, res) => {
    console.log("Route d'inscription au cours");
    
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
            console.error(' Erreur BDD check inscription:', err);
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
                console.error('Erreur lors de l'+'inscription :', err);
                return res.status(500).json({ success: false, message: 'Erreur lors de l'+'inscription ' });
            }
            console.log('✅ Inscrit:', users_id, '→ cours:', cours_id);
            res.json({ success: true, message: 'Inscription au cours réussie !' });
        });
    });
};


module.exports.deleteCours = (req, res) => {
    const { id } = req.params;
    const users_id = req.session.user?.id;
    console.log("Route de suppression des cours " )

    if (!users_id) return res.status(401).json({ success: false, message: 'Non connecté' });

    const checkSql = 'SELECT id FROM cours WHERE id = ? AND users_id = ?';
    db.query(checkSql, [id, users_id], (err, results) => {
        if (err || !results.length) {
            return res.status(403).json({ success: false, message: 'Accès refusé' });
        }
        
        const deleteSql = 'DELETE FROM cours WHERE id = ?';
        db.query(deleteSql, [id], (deleteErr) => {
            if (deleteErr) {
                console.error('Erreur de suppression du cours:', deleteErr);
                return res.status(500).json({ success: false, message: 'Erreur de suppression du cours' });
            }
            res.status(204).send();
        });
    });
};
