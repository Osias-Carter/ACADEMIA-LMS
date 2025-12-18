const { Router } = require('express');
const path = require('path');
const coursController = require('../controllers/coursController');

const router = Router();
const viewsPath = path.join(__dirname, '..', 'views');

router.get('/professeur/cours', (req, res) => {
    res.sendFile('professeur/cours.html', { root: viewsPath });
});

router.get('/dashboard', (req, res) => {
    res.sendFile('/dashboard.html', { root: viewsPath });
});

router.post("/professeur/cours", coursController.cours);
router.get('/professeur/cours-list', coursController.getCoursProf);  

router.get('/categories', coursController.getCategories);
router.get('/niveau', coursController.getNiveaux);

module.exports = router;
