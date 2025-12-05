const express = require('express');
const router = express.Router();

// Importăm modelul Utilizator
// Ajustăm calea cu ".." pentru a ieși din folderul routes și a intra in models
const Utilizator = require('../models/utilizator');

// RUTA GET: Returnează toate conferințele
router.get('/utilizatori', async (req, res) => {
    try {
        const utilizatori = await Utilizator.findAll();
        res.status(200).json(utilizatori);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la preluarea utilizatorilor" });
    }
});

//RUTE GET pt toate rolurile
router.get('/utilizatori/autori', async (req, res) => {
    try {
        const autori = await Utilizator.findAll({
            where: {
                rol: 'AUTOR' // Filtrează unde rolul este 'AUTOR'
            }
        });
        res.status(200).json(autori);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la preluarea autorilor" });
    }
});
router.get('/utilizatori/revieweri', async (req, res) => {
    try {
        const revieweri = await Utilizator.findAll({
            where: {
                rol: 'REVIEWER' // Filtrează unde rolul este 'REVIEWER'
            }
        });
        res.status(200).json(revieweri);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la preluarea reviewerilor" });
    }
});
router.get('/utilizatori/organizatori', async (req, res) => {
    try {
        const organizatori = await Utilizator.findAll({
            where: {
                rol: 'ORGANIZATOR' // Filtrează unde rolul este 'ORGANIZATOR'
            }
        });
        res.status(200).json(organizatori);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la preluarea organizatorilor" });
    }
});

// RUTA POST: Creează un utilizator
router.post('/utilizatori', async (req, res) => {
    try {
        const nouUtilizator = await Utilizator.create(req.body);
        res.status(201).json(nouUtilizator);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la crearea utilizatorului" });
    }
});

// RUTA DELETE: Șterge un utilizator după ID
router.delete('/utilizatori/:idUtilizator', async (req, res) => {
    try {
        const userId = parseInt(req.params.idUtilizator);

    
        const deletedRowCount = await Utilizator.destroy({
            where: {
                id: userId
            }
        });

        if (deletedRowCount === 0) {
            return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
        }

        res.status(202).json({ message: "Utilizator șters cu succes." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la ștergerea utilizatorului." });
    }
});

router.get('/utilizatori/:idUtilizator', async (req, res) => {
    try {
        const userId = parseInt(req.params.idUtilizator);

        const utilizator = await Utilizator.findByPk(userId);

        if (!utilizator) {
            return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
        }

        res.status(200).json(utilizator);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la preluarea utilizatorului." });
    }
});

module.exports = router;