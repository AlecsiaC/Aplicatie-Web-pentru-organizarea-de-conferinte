const express = require('express');
const router = express.Router();
const Conferinta = require('../models/conferinta');

// IMPORTĂM MODELELE (O singură dată)
const Utilizator = require('../models/utilizator');
const Articol = require('../models/articol');

// ==========================================
// RUTE PENTRU CONFERINȚE
// ==========================================

// 1. GET: Returnează toate conferințele
// URL: http://localhost:3000/api/conferinte
router.get('/', async (req, res) => {
    try {
        const conferinte = await Conferinta.findAll({
            include: [
        { 
            model: Utilizator, 
            as: 'Revieweri',
            attributes: ['id'] // Avem nevoie doar de ID pentru filtrare
        }
    ]
        });
        res.status(200).json(conferinte);
    } catch (err) {
        console.error("Eroare la preluarea conferințelor:", err);
        res.status(500).json({ message: "Eroare la preluarea conferințelor" });
    }
});

// GET: Detalii conferință + Revieweri
// GET: Detalii conferință + Revieweri + Articole
// backend/routes/conferintaRouter.js

router.get('/:id', async (req, res) => {
    try {
        const conferinta = await Conferinta.findByPk(req.params.id, {
            include: [
                { 
                    model: Articol, 
                    as: 'Articole',
                    include: [
                        {
                            model: Utilizator,
                            as: 'Autor',
                            attributes: ['numeUtilizator']
                        },
                        // Includem reviewerii alocați fiecărui articol
                        {
                            model: Utilizator,
                            as: 'Revieweri', 
                            attributes: ['id', 'numeUtilizator'],
                            through: { attributes: ['verdict', 'continut', 'dataReview'] } // Ascundem datele din tabela de legătură
                        }
                    ]
                },
                { 
                    model: Utilizator, 
                    as: 'Revieweri' 
                }
            ]
        });

        if (conferinta) {
            res.status(200).json(conferinta);
        } else {
            res.status(404).json({ message: 'Conferinta nu a fost găsită' });
        }
    } catch (error) {
        console.error("EROARE BACKEND:", error);
        res.status(500).json(error);
    }
});

// 2. POST: Creează o conferință nouă și alocă revieweri
// URL: http://localhost:3000/api/conferinte
// 2. POST: Creează o conferință nouă și alocă revieweri
// URL: http://localhost:3000/api/conferinte
router.post('/', async (req, res, next) => {
    try {
        const { titluConf, descriere, data, ora, status, organizatorId, reviewerIds } = req.body;
        
        // Creăm conferința
        const nouaConferinta = await Conferinta.create({
            titluConf,
            descriere,
            data,
            ora,
            status,
            organizatorId
        });

        // --- LOGICA NOUĂ: Alocare automată dacă nu s-au selectat revieweri ---
        let idsFinali = reviewerIds;

        if (!idsFinali || idsFinali.length === 0) {
            console.log("Nu s-au selectat revieweri. Căutăm primii 2 revieweri în baza de date...");
            
            // Căutăm primii 2 utilizatori care au rolul 'REVIEWER'
            const revieweriGasiti = await Utilizator.findAll({
                where: { rol: 'REVIEWER' },
                limit: 2, // Luăm doar primii 2
                attributes: ['id'] // Luăm doar ID-ul, nu avem nevoie de restul datelor
            });

            // Extragem doar ID-urile din rezultatul Sequelize
            idsFinali = revieweriGasiti.map(r => r.id);
        }
        // --------------------------------------------------------------------

        // Alocăm reviewerii (fie cei selectați, fie cei 2 găsiți automat)
        if (idsFinali && idsFinali.length > 0) {
            await nouaConferinta.setRevieweri(idsFinali);
        }

        res.status(201).json(nouaConferinta);
    } catch (err) {
        console.error("Eroare la crearea conferinței:", err);
        next(err);
    }
});

// // 3. GET by ID: Returnează o conferință după ID
// router.get('/:idConferinta', async (req, res) => {
//     try {
//         const conferinta = await Conferinta.findByPk(req.params.idConferinta);
//         if (!conferinta) {
//             return res.status(404).json({ message: "Conferința nu a fost găsită." });
//         }
//         res.status(200).json(conferinta);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Eroare la preluarea conferinței." });
//     }
// });

router.get('/:idConferinta', async (req, res) => {
    try {
        const conf = await Conferinta.findByPk(req.params.id, { /* include-urile tale */ });
        
        // Verificăm dacă ora a trecut
        const acum = new Date();
        const dataConf = new Date(`${conf.data}T${conf.ora}`);

        if (acum > dataConf && conf.status !== 'FINALIZATA') {
            await conf.update({ status: 'FINALIZATA' });
        }
        
        res.status(200).json(conf);
    } catch (err) { res.status(500).json(err); }
});

// 4. DELETE: Șterge o conferință după ID
router.delete('/:idConferinta', async (req, res) => {
    try {
        const deletedRowCount = await Conferinta.destroy({
            where: { id: req.params.idConferinta }
        });

        if (deletedRowCount === 0) {
            return res.status(404).json({ message: "Conferința nu a fost găsită." });
        }
        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la ștergerea conferinței." });
    }
});

// ==========================================
// RUTE PENTRU REVIEWERI
// ==========================================

// 5. GET: Vezi revieweri unei conferințe
router.get('/:idConferinta/revieweri', async (req, res) => {
    try {
        const conferinta = await Conferinta.findByPk(req.params.idConferinta, {
            include: [{
                model: Utilizator,
                as: 'Revieweri',
                attributes: ['id', 'numeUtilizator', 'email']
            }]
        });

        if (!conferinta) return res.status(404).json({ message: "Conferința nu există" });
        res.status(200).json(conferinta.Revieweri);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare server la preluarea reviewerilor" });
    }
});

// 6. PUT: Alocă un singur reviewer (manual)
router.put('/:idConferinta/revieweri/:idReviewer', async (req, res) => {
    try {
        const conferinta = await Conferinta.findByPk(req.params.idConferinta);
        const reviewer = await Utilizator.findByPk(req.params.idReviewer);

        if (!conferinta || !reviewer) {
            return res.status(404).json({ message: "Conferința sau utilizatorul nu există." });
        }

        if (reviewer.rol !== 'REVIEWER') {
            return res.status(400).json({ message: "Utilizatorul nu are rolul de REVIEWER." });
        }

        await conferinta.addRevieweri(reviewer);
        res.status(200).json({ message: `Reviewer-ul ${reviewer.numeUtilizator} a fost alocat.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la alocarea reviewer-ului." });
    }
});

// ==========================================
// RUTE PENTRU PARTICIPANȚI
// ==========================================

// 7. POST: Înscriere participant
router.post('/:idConferinta/inregistrare', async (req, res) => {
    try {
        const conferinta = await Conferinta.findByPk(req.params.idConferinta);
        const user = await Utilizator.findByPk(req.body.idUtilizator);

        if (!conferinta || !user) {
            return res.status(404).json({ message: "Date invalide." });
        }

        await conferinta.addParticipanti(user); 
        res.status(200).json({ message: "Înregistrare cu succes!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la înregistrare." });
    }
});


router.put('/:id', async (req, res) => {
    try {
        const { titluConf, descriere, data, ora, reviewerIds } = req.body;
        const conferinta = await Conferinta.findByPk(req.params.id);

        if (!conferinta) return res.status(404).json({ message: "Negăsită" });

        await conferinta.update({ titluConf, descriere, data, ora });

        // Actualizăm revieweri (Sequelize va șterge legăturile vechi și le va pune pe cele noi)
        if (reviewerIds) {
            await conferinta.setRevieweri(reviewerIds);
        }

        res.status(200).json(conferinta);
    } catch (error) { res.status(500).json(error); }
});

module.exports = router;