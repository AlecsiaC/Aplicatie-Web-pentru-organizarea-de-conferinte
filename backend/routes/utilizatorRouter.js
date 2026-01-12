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

// RUTA POST: Login (Verificare credențiale)
router.post('/login', async (req, res) => {
    try {
        const { email, parola } = req.body;

        // 1. Căutăm utilizatorul după email
        const user = await Utilizator.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "Utilizator nu există." });
        }

        // 2. Verificăm parola (Simplificat, fără criptare momentan)
        if (user.parola !== parola) {
            return res.status(401).json({ message: "Parolă incorectă." });
        }

        // 3. Returnăm succes și datele userului (inclusiv ID-ul și ROLUL)
        // Frontend-ul va avea nevoie de ID și ROL ca să știe ce butoane să arate.
        res.status(200).json({
            message: "Login reușit!",
            user: {
                id: user.id,
                nume: user.numeUtilizator,
                email: user.email,
                rol: user.rol
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la login." });
    }
});

// RUTA POST: Creează un utilizator
router.post('/utilizatori', async (req, res) => {
    try {
        const nouUtilizator = await Utilizator.create(req.body);
        res.status(201).json(nouUtilizator);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: "Acest email este deja folosit." });
        }
        if (err.name === 'SequelizeValidationError') {
             return res.status(400).json({ message: "Date invalide (verifică formatul email-ului)." });
        }

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