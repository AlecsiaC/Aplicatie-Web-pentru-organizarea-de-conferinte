const express = require('express');
const router = express.Router();

// Importăm modelele
// Ajustăm calea cu ".." pentru a ieși din folderul routes și a intra in models
const Conferinta = require('../models/conferinta');
const Utilizator = require('../models/utilizator');

// RUTA GET: Returnează toate conferințele
router.get('/conferinte', async (req, res) => {
    try {
        const conferinte = await Conferinta.findAll();
        res.status(200).json(conferinte);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la preluarea conferintelor" });
    }
});

// RUTA POST: Creează o conferință nouă
router.post('/conferinte', async (req, res) => {
    try {
        // req.body conține datele trimise de client (titlu, descriere, etc.)
        const nouaConferinta = await Conferinta.create(req.body);
        res.status(201).json(nouaConferinta);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la crearea conferintei" });
    }
});

// RUTA POST: Un utilizator se înscrie ca participant la o conferință
// URL: http://localhost:3000/api/conferinte/:idConferinta/inregistrare
router.post('/conferinte/:idConferinta/inregistrare', async (req, res) => {
    try {
        const { idConferinta } = req.params;
        const { idUtilizator } = req.body; // ID-ul celui care vrea să participe

        // 1. Găsim conferința
        const conferinta = await Conferinta.findByPk(idConferinta);
        if (!conferinta) {
            return res.status(404).json({ message: "Conferința nu există." });
        }

        // 2. Găsim utilizatorul
        const user = await Utilizator.findByPk(idUtilizator);
        if (!user) {
            return res.status(404).json({ message: "Utilizatorul nu există." });
        }

        // 3. Facem înscrierea (Magic Method generată de Sequelize din alias-ul 'Participanti')
        // Funcția este addParticipanti (pentru că aliasul e la plural) sau addParticipant (singular)
        // Sequelize e tricky aici, de obicei încearcă singularul dacă aliasul e plural, dar să fim siguri:
        // Vom folosi metoda generică addModel
        
        await conferinta.addParticipanti(user); 

        res.status(200).json({ message: `Utilizatorul ${user.numeUtilizator} a fost înregistrat cu succes la conferință!` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la înregistrare." });
    }
});

// RUTA GET: Vedem cine s-a înscris la o conferință
router.get('/conferinte/:idConferinta/participanti', async (req, res) => {
    try {
        const conferinta = await Conferinta.findByPk(req.params.idConferinta, {
            include: [{
                model: Utilizator,
                as: 'Participanti',
                attributes: ['id', 'numeUtilizator', 'email']
            }]
        });

        if (!conferinta) return res.status(404).json({ message: "Conferința nu există" });

        res.status(200).json(conferinta.Participanti);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare server" });
    }
});

// RUTA GET by ID: Returnează o conferință după ID
router.get('/conferinte/:idConferinta', async (req, res) => {
    try {
        const conferintaId = parseInt(req.params.idConferinta);

        const conferinta = await Conferinta.findByPk(conferintaId);

        if (!conferinta) {
            return res.status(404).json({ message: "Conferința nu a fost găsită." });
        }

        res.status(200).json(conferinta);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la preluarea conferinței." });
    }
});


// RUTA DELETE by ID: Șterge o conferință după ID

router.delete('/conferinte/:idConferinta', async (req, res) => {
    // middleware de autorizare

    try {
        const conferintaId = parseInt(req.params.idConferinta);

        const deletedRowCount = await Conferinta.destroy({
            where: {
                id: conferintaId
            }
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

// RUTA PUT: Alocă un reviewer la o conferință
// URL exemplu: http://localhost:3000/api/conferinte/1/revieweri/2  (Conferinta 1, User 2)
router.put('/conferinte/:idConferinta/revieweri/:idReviewer', async (req, res) => {
    try {
        const conferintaId = req.params.idConferinta;
        const reviewerId = req.params.idReviewer;

        // 1. Căutăm conferința
        const conferinta = await Conferinta.findByPk(conferintaId);
        if (!conferinta) {
            return res.status(404).json({ message: "Conferința nu a fost găsită." });
        }

        // 2. Căutăm reviewer-ul
        const reviewer = await Utilizator.findByPk(reviewerId);
        if (!reviewer) {
            return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
        }

        // 3. Validare Business Logic: E chiar reviewer?
        if (reviewer.rol !== 'REVIEWER') {
            return res.status(400).json({ message: "Utilizatorul nu are rolul de REVIEWER." });
        }

        // 4. Facem legătura (Magic Method de la Sequelize)
        // Deoarece am definit 'as: Revieweri' în server.js, avem funcția addReviewer
        await conferinta.addRevieweri(reviewer);

        res.status(200).json({ message: `Reviewer-ul ${reviewer.numeUtilizator} a fost alocat conferinței.` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la alocarea reviewer-ului." });
    }
});

// RUTA GET: Vezi revieweri unei conferințe (Ca să verificăm că a mers)
router.get('/conferinte/:idConferinta/revieweri', async (req, res) => {
    try {
        const conferinta = await Conferinta.findByPk(req.params.idConferinta, {
            include: ['Revieweri'] // Aici folosim alias-ul din server.js
        });

        if (!conferinta) return res.status(404).json({ message: "Conferința nu există" });

        res.status(200).json(conferinta.Revieweri);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare server" });
    }
});

module.exports = router;