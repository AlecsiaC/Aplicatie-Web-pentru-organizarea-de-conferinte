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

// RUTA DELETE: Șterge un articol după ID
router.delete('/articole/:idArticol', async (req, res) => {
    try {
        const articolId = parseInt(req.params.idArticol);

        const deletedRowCount = await Articol.destroy({
            where: {
                id: articolId
            }
        });

        if (deletedRowCount === 0) {
            // Dacă nu s-a șters niciun rând, articolul nu a fost găsit
            return res.status(404).json({ message: "Articolul nu a fost găsit." });
        }

        res.sendStatus(204);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la ștergerea articolului." });
    }
});

// RUTA GET: Returnează un articol după ID
router.get('/articole/:idArticol', async (req, res) => {
    try {
        const articolId = parseInt(req.params.idArticol);

        const articol = await Articol.findByPk(articolId);

        if (!articol) {
            return res.status(404).json({ message: "Articolul nu a fost găsit." });
        }

        res.status(200).json(articol);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la preluarea articolului." });
    }
});

module.exports = router;