const db = require('../config/db');

exports.getQuiz = (req, res) => {
    const leconId = req.params.leconId;
    
    db.query(`
        SELECT 
            q.id as quiz_id,
            q.titre_quiz,
            qq.id as question_id,
            qq.texte_question,
            qq.points,
            oq.id as option_id,
            oq.texte_option,
            oq.est_correct
        FROM quiz q
        JOIN questions_quiz qq ON q.id = qq.quiz_id
        LEFT JOIN option_quiz oq ON qq.id = oq.questions_quiz_id
        JOIN lecons l ON q.leconsid = l.id
        WHERE l.id = ?
    `, [leconId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            return res.json({ error: 'Aucun quiz trouvé' });
        }
        
        const quiz = {
            titre: results[0].titre_quiz,
            questions: []
        };
        
        results.forEach(row => {
            let question = quiz.questions.find(q => q.id === row.question_id);
            if (!question) {
                question = {
                    id: row.question_id,
                    texte: row.texte_question,
                    points: row.points,
                    options: []
                };
                quiz.questions.push(question);
            }
            question.options.push({
                id: row.option_id,
                texte: row.texte_option,
                correct: row.est_correct == 1
            });
        });
        
        res.json(quiz);
    });
};
