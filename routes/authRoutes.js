const { Router } = require('express');
const authController = require('../controllers/authController');
const path = require('path');

const router = Router();
const viewsPath = path.join(__dirname, '..', 'views');

// Pages
router.get("/", (req, res) => {
    res.sendFile('home.html', { root: viewsPath });
});

router.get('/user/register', (req, res) => {
    res.sendFile('/user/register.html', { root: viewsPath });
});

router.get('/professeur/pregister', (req, res) => {
    res.sendFile('/professeur/pregister.html', { root: viewsPath });
});

router.get('/user/login', (req, res) => {
    res.sendFile('/user/login.html', { root: viewsPath });
});

router.get('/professeur/plogin', (req, res) => {
    res.sendFile('/professeur/plogin.html', { root: viewsPath });
});

router.get('/dashboard', (req, res) => {
    res.sendFile('/dashboard.html', { root: viewsPath });
});

router.get('/professeur/cours.html', (req, res) => {
    res.sendFile('/professeur/cours.html', { root: viewsPath });
});

router.get('/user-info', authController.getUserInfo);

// POST
router.post("/user/register", authController.register);
router.post("/professeur/pregister", authController.pregister);
router.post("/professeur/plogin", authController.plogin);
router.post("/user/login", authController.login);

router.get('/getUserSession', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });

    res.json({ success: true, user: req.session.user });
    console.log("routes true");
});

module.exports = router;
