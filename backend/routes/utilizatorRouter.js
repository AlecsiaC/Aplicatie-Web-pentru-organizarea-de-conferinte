const express = require('express');
const router = express.Router();
const Utilizator = require('../models/utilizator');

// ==========================================
// 1. RUTE GENERALE
// ==========================================

// GET: Toti utilizatorii (http://localhost:3000/api/utilizatori)
router.get('/', async (req, res) => {
    try {
        const utilizatori = await Utilizator.findAll();
        res.status(200).json(utilizatori);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la preluarea utilizatorilor" });
    }
});

// POST: Creeaza un utilizator nou / Inregistrare (http://localhost:3000/api/utilizatori)
router.post('/', async (req, res) => {
    try {
        const { numeUtilizator, email, parola, rol } = req.body;

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

        if (!passwordRegex.test(parola)) {
            return res.status(400).json({ 
                message: "Parola trebuie să aibă minim 8 caractere și să conțină atât litere cât și cifre." 
            });
        }

        const nouUtilizator = await Utilizator.create({
            numeUtilizator,
            email,
            parola,
            rol
        });

        res.status(201).json(nouUtilizator);
        } catch (err) {
            if (err.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ message: "Acest email este deja folosit." });
            }
            console.error(err);
            res.status(500).json({ message: "Eroare la crearea utilizatorului" });
        }
});

// ==========================================
// 2. RUTE DE FILTRARE (ROLURI)
// ==========================================

// GET: Doar Autorii (http://localhost:3000/api/utilizatori/autori)
router.get('/autori', async (req, res) => {
    try {
        const autori = await Utilizator.findAll({ where: { rol: 'AUTOR' } });
        res.status(200).json(autori);
    } catch (err) {
        res.status(500).json({ message: "Eroare la preluarea autorilor" });
    }
});

// GET: Doar Reviewerii (http://localhost:3000/api/utilizatori/revieweri)
router.get('/revieweri', async (req, res) => {
    try {
        const revieweri = await Utilizator.findAll({ where: { rol: 'REVIEWER' } });
        res.status(200).json(revieweri);
    } catch (err) {
        res.status(500).json({ message: "Eroare la preluarea reviewerilor" });
    }
});

// GET: Doar Organizatorii (http://localhost:3000/api/utilizatori/organizatori)
router.get('/organizatori', async (req, res) => {
    try {
        const organizatori = await Utilizator.findAll({ where: { rol: 'ORGANIZATOR' } });
        res.status(200).json(organizatori);
    } catch (err) {
        res.status(500).json({ message: "Eroare la preluarea organizatorilor" });
    }
});

// ==========================================
// 3. RUTE SPECIFICE (LOGIN & ID)
// ==========================================

// POST: Login (http://localhost:3000/api/utilizatori/login)
router.post('/login', async (req, res) => {
    try {
        const { email, parola } = req.body;
        const user = await Utilizator.findOne({ where: { email } });

        if (!user || user.parola !== parola) {
            return res.status(401).json({ message: "Email sau parolă incorectă." });
        }

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
        res.status(500).json({ message: "Eroare la login." });
    }
});

// GET: Un utilizator dupa ID (http://localhost:3000/api/utilizatori/:id)
router.get('/:idUtilizator', async (req, res) => {
    try {
        const user = await Utilizator.findByPk(req.params.idUtilizator);
        if (!user) return res.status(404).json({ message: "Utilizator negăsit." });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: "Eroare la preluarea utilizatorului." });
    }
});

// DELETE: Sterge un utilizator (http://localhost:3000/api/utilizatori/:id)
router.delete('/:idUtilizator', async (req, res) => {
    try {
        const deleted = await Utilizator.destroy({ where: { id: req.params.idUtilizator } });
        if (deleted === 0) return res.status(404).json({ message: "Nu s-a găsit pentru ștergere." });
        res.status(202).json({ message: "Utilizator șters cu succes." });
    } catch (err) {
        res.status(500).json({ message: "Eroare la ștergere." });
    }
});

module.exports = router;