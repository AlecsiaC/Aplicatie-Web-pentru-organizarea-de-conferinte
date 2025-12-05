// backend/routes/reviewRouter.js
const express = require('express');
const router = express.Router();

// Importăm modelul Review
const Review = require('../models/review');

// RUTA GET: Vedem toate review-urile (util pentru admin/organizator)
router.get('/reviews', async (req, res) => {
    try {
        const reviews = await Review.findAll();
        res.status(200).json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la preluarea review-urilor" });
    }
});

// RUTA POST: Adăugarea unui review (Aprobare/Respingere + Feedback)
router.post('/reviews', async (req, res) => {
    try {
        const nouReview = await Review.create(req.body);
        res.status(201).json(nouReview);
    } catch (err) {
        console.error(err);
        // Daca verdictul nu e unul din cele 3 valori ENUM, va intra aici
        res.status(500).json({ message: "Eroare la crearea review-ului. Verifică verdictul!" });
    }
});

module.exports = router;
