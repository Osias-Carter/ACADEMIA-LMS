const { Router } = require('express');
const authController = require('../controllers/authController');
const path = require('path');
const multer = require('multer');
const router = Router();
const viewsPath = path.join(__dirname, '..', 'views');
// ⚠️ Ajout simple pour gérer les fichiers
const upload = multer({ dest: "uploads/" });



// Route GET pour afficher les pages
router.get("/", (req, res) => {
    res.sendFile('home.html', { root: viewsPath });
});

router.get('/register', (req, res) => {
    res.sendFile('register.html', { root: viewsPath });
});

router.get('/pregister', (req, res) => {
    res.sendFile('pregister.html', { root: viewsPath });
});

router.get('/login', (req, res) => {
    res.sendFile('login.html', { root: viewsPath });
});

router.get('/plogin', (req, res) => {
    res.sendFile('plogin.html', { root: viewsPath });
});

router.get('/dashboard', (req, res) => {
    res.sendFile('dashboard.html', { root: viewsPath });
});

// Route POST pour gérer l'inscription et la connexion et appeler les contrôleurs
router.post("/register", (req, res) => authController.register(req, res));
// ⚠️ ICI on ajoute juste le upload
router.post("/pregister", upload.single("justificatif"), (req, res) => 
    authController.pregister(req, res)
);
router.post("/plogin", (req, res) => authController.plogin(req, res));
router.post("/login", (req, res) => authController.login(req, res));

// Route pour récupérer les infos utilisateur connecté
module.exports.getUserSession = (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Non connecté' });
    }
    res.json({
        success: true,
        user: req.session.user
    });
};
module.exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Erreur logout' });
        }
        res.redirect('/login');
    });
};


module.exports = router;
