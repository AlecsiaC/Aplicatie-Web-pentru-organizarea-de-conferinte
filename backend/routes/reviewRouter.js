const express = require('express');
const router = express.Router();
const Review = require('../models/review');
const Articol = require('../models/articol');

// POST: Reviewer-ul trimite evaluarea folosind articolId și reviewerId
router.post('/', async (req, res) => {
    try {
        const { articolId, reviewerId, verdict, continut } = req.body;

        // Căutăm review-ul alocat (cel creat automat la upload)
        const review = await Review.findOne({
            where: { 
                articolId: articolId, 
                reviewerId: reviewerId 
            }
        });

        if (!review) {
            return res.status(404).json({ message: "Nu a fost găsită alocarea pentru acest articol/reviewer." });
        }

        // Actualizam review-ul existent cu verdictul și feedback-ul
        await review.update({
            verdict: verdict,
            continut: continut,
            dataReview: new Date()
        });

        // ----------------------------------------------------
        // LOGICA DE ACTUALIZARE STATUS ARTICOL
        // ----------------------------------------------------
        const toateReviewurile = await Review.findAll({ where: { articolId: articolId } });
        
        // Verificam dacă toti cei alocati au apucat sa dea verdictul (nu mai e null)
        const toțiAuEvaluat = toateReviewurile.every(r => r.verdict !== null);
        
        if (toțiAuEvaluat) {
            const toateAcceptate = toateReviewurile.every(r => r.verdict === 'ACCEPTAT');
            const unulRespins = toateReviewurile.some(r => r.verdict === 'RESPINS');

            const articol = await Articol.findByPk(articolId);

            if (toateAcceptate) {
                await articol.update({ status: 'ACCEPTAT' });
            } else if (unulRespins) {
                await articol.update({ status: 'RESPINS' });
            } else {
                await articol.update({ status: 'NECESITA_MODIFICARI' });
            }
        }

        res.status(200).json({ message: "Review salvat cu succes!", review });

    } catch (err) {
        console.error("EROARE BACKEND:", err);
        res.status(500).json({ message: "Eroare la salvarea review-ului." });
    }
});



// RUTA GET: Reviewer-ul isi vede review-urile alocate
// Exemplu: GET /reviews/reviewer/2
router.get('/reviews/reviewer/:idReviewer', async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: { reviewerId: req.params.idReviewer },
            include: [{model: Articol, as: 'Articol'}]
        });
        res.status(200).json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare server" });
    }
});

// RUTA PUT: Reviewer-ul da verdictul
// Exemplu: PUT /reviews/5 (unde 5 e ID-ul review-ului alocat)
router.put('/reviews/:idReview', async (req, res) => {
    try {
        const { idReview } = req.params;
        const { verdict, continut } = req.body;

        const review = await Review.findByPk(idReview);

        if (!review) {
            return res.status(404).json({ message: "Review-ul nu există." });
        }

        // Actualizăm review-ul
        await review.update({
            verdict,
            continut,
            dataReview: new Date()
        });

        // ----------------------------------------------------
        // LOGICA COMPLEXA: Calculam dacă Articolul e ACCEPTAT
        // ----------------------------------------------------
        // Cautam toate review-urile acestui articol
        const toateReviewurile = await Review.findAll({ where: { articolId: review.articolId } });
        
        // Verificam dacă toti au dat 'ACCEPTAT'
        const toateAcceptate = toateReviewurile.every(r => r.verdict === 'ACCEPTAT');
        const unulRespins = toateReviewurile.some(r => r.verdict === 'RESPINS');

        const articol = await Articol.findByPk(review.articolId);

        if (toateAcceptate && toateReviewurile.length >= 2) {
            await articol.update({ status: 'ACCEPTAT' });
        } else if (unulRespins) {
            await articol.update({ status: 'RESPINS' });
        } else {
            await articol.update({ status: 'NECESITA_MODIFICARI' });
        }

        res.status(200).json({ message: "Review salvat cu succes!", review });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la salvarea review-ului." });
    }
});

module.exports = router;