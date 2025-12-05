const express = require('express');
const router = express.Router();

// Importăm modelul Conferinta
// Ajustăm calea cu ".." pentru a ieși din folderul routes și a intra in models
const Conferinta = require('../models/conferinta');

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

module.exports = router;