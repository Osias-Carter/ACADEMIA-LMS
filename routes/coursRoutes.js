const { Router } = require('express');
const path = require('path');
const coursController = require('../controllers/coursController');

const router = Router();
const viewsPath = path.join(__dirname, '..', 'views');

console.log('🚀 Routes Cours chargées'); // Debug

// PAGES
router.get('/professeur/cours', (req, res) => {
    res.sendFile('professeur/cours.html', { root: viewsPath });
});
router.get('/dashboard', (req, res) => {
    res.sendFile('dashboard.html', { root: viewsPath });
});

router.get('/cours-list', coursController.getAllCours);           // ✅ Étudiants
router.get('/professeur/cours-list', coursController.getCoursProf); // ✅ Profs 

// API CRUD
router.post('/etudiant/inscription', coursController.inscriptionCours);
router.post('/professeur/cours', coursController.cours);
router.delete('/cours/:id', coursController.deleteCours); // ← CORRIGÉ : /cours/:id
router.get('/categories', coursController.getCategories);
router.get('/niveau', coursController.getNiveaux);

module.exports = router;
