const express = require('express');
const router = express.Router();

// Importăm modelul Articol
const Articol = require('../models/articol');

// RUTA GET: Returnează toate articolele
router.get('/articole', async (req, res) => {
    try {
        const articole = await Articol.findAll();
        res.status(200).json(articole);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la preluarea articolelor" });
    }
});

// RUTA POST: Creează un articol nou
router.post('/articole', async (req, res) => {
    try {
        // req.body trebuie să conțină: titluArticol, rezumat, caleFisier, autorId, conferintaId
        const nouArticol = await Articol.create(req.body);
        res.status(201).json(nouArticol);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la crearea articolului" });
    }
});

module.exports = router;