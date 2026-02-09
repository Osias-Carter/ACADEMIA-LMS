const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Récupère quiz d'une leçon (ID=1)
router.get('/lecons/:id', quizController.getQuiz);

module.exports = router;
