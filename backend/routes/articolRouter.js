const express = require('express');
const router = express.Router();
const multer = require('multer'); // Modul pentru gestionarea upload-ului de fisiere
const path = require('path');
const fs = require('fs');

const Articol = require('../models/articol');
const Utilizator = require('../models/utilizator');
const Conferinta = require('../models/conferinta');
const Review = require('../models/review');

// --- CONFIGURARE MULTER (Pentru salvarea PDF-urilor) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Salvare fisier 
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Doar fișierele PDF sunt permise!'), false);
        }
    }
});

// --- RUTA POST: Încărcare articol + Salvare fișier ---
router.post('/', upload.single('fisier'), async (req, res) => {
    const conf = await Conferinta.findByPk(req.body.conferintaId);
    // Verificam daca perioada de inscriere a expirat
    if (new Date() > new Date(`${conf.data}T${conf.ora}`)) {
        return res.status(403).json({ message: "Conferința s-a încheiat. Nu se mai pot adăuga articole." });
    }
    try {
        console.log("--- DATE PRIMITE ---");
        console.log("Body:", req.body);
        console.log("File:", req.file);
        if (!req.file) {
            return res.status(400).json({ message: "Nu a fost încărcat niciun fișier PDF." });
        }

        const { titluArticol, numeArticol, rezumat, autorId, conferintaId } = req.body;

        const titluFinal = titluArticol || numeArticol || req.file.originalname;
        const caleFisier = req.file.filename;

        const autor = await Utilizator.findByPk(autorId);
        if (!autor) return res.status(404).json({ message: "Autorul nu a fost găsit." });

        const conferinta = await Conferinta.findByPk(conferintaId, {
            include: [{ model: Utilizator, as: 'Revieweri' }]
        });
        if (!conferinta) return res.status(404).json({ message: "Conferința nu a fost găsită." });

        // Cream intrarea in baza de date pentru noul articol
        const nouArticol = await Articol.create({
            titluArticol: titluFinal, 
            rezumat: rezumat || "Fără rezumat",
            caleFisier,
            autorId,
            conferintaId,
            versiune: 1,
            status: 'IN_EVALUARE'
        });

        if (conferinta.Revieweri && conferinta.Revieweri.length > 0) {
            const revieweriAmestecati = conferinta.Revieweri.sort(() => 0.5 - Math.random());
            const ceiAlesi = revieweriAmestecati.slice(0, 2);

            for (const rev of ceiAlesi) {
                await Review.create({
                    reviewerId: rev.id,
                    articolId: nouArticol.id,
                    verdict: null,
                    continut: ""
                });
            }
        }

        res.status(201).json({ 
            message: "Articol și fișier încărcate cu succes!", 
            articol: nouArticol 
        });

    } catch (err) {
        console.error("EROARE LA UPLOAD:", err);
        res.status(500).json({ message: "Eroare la server la procesarea fișierului.", error: err.message });
    }
});

// --- RUTA GET: Articolele unei conferințe ---
router.get('/conferinte/:idConferinta/articole', async (req, res) => {
    try {
        const articole = await Articol.findAll({
            where: { conferintaId: req.params.idConferinta },
            include: [{
                model: Utilizator,
                as: 'Autor',
                attributes: ['numeUtilizator', 'email']
            }]
        });
        res.status(200).json(articole);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la preluarea articolelor." });
    }
});

// --- RUTA GET: Download fizic al fisierului PDF ---
router.get('/download/:id', async (req, res) => {
    try {
        const articol = await Articol.findByPk(req.params.id);

        if (!articol) {
            return res.status(404).json({ message: "Articolul nu a fost găsit în baza de date." });
        }

       let caleaFizica = path.resolve(__dirname, '..', 'uploads', articol.caleFisier);
        
        if (articol.caleFisier.startsWith('uploads')) {
             caleaFizica = path.resolve(__dirname, '..', articol.caleFisier);
        }

        console.log("Se încearcă descărcarea de la:", caleaFizica);
        if (fs.existsSync(caleaFizica)) {
            // extensie .pdf la finalul numelui
            const numeDescarcare = articol.titluArticol.endsWith('.pdf') 
                ? articol.titluArticol 
                : `${articol.titluArticol}.pdf`;

            return res.download(caleaFizica, numeDescarcare);
        } else {
            console.error("Fișierul lipsește de pe disk:", caleaFizica);
            return res.status(404).json({ message: "Fișierul fizic nu a fost găsit pe server." });
        }

    } catch (err) {
        console.error("Eroare la descărcare:", err);
        res.status(500).json({ message: "Eroare internă la descărcarea fișierului." });
    }
});

// --- RUTA PUT: Actualizare articol (Re-upload dupa modificari) ---
router.put('/:id', upload.single('fisier'), async (req, res) => {
    try {
        const articol = await Articol.findByPk(req.params.id);
        if (!articol) return res.status(404).json({ message: "Articol negăsit" });

        const updateData = {
            status: 'IN_REEVALUARE',
        };
        
        if (req.file) {
            updateData.caleFisier = req.file.path;
        }

        await articol.update(updateData);

        await Review.update(
            { verdict: null, continut: "Așteaptă re-evaluare după modificări." },
            { where: { articolId: articol.id } }
        );

        res.status(200).json(articol);
    } catch (error) {
        res.status(500).json(error);
    }
});

// --- RUTA DELETE: Sterge un articol din baza de date ---
router.delete('/:id', async (req, res) => {
    try {
        const articol = await Articol.findByPk(req.params.id);
        
        if (!articol) {
            return res.status(404).json({ message: "Articolul nu a fost găsit." });
        }

        await articol.destroy();

        res.status(200).json({ message: "Articol șters cu succes." });
    } catch (error) {
        console.error("Eroare la ștergere:", error);
        res.status(500).json({ message: "Eroare internă de server." });
    }
});

// --- RUTA GET: Toate articolele (Dashboard general) ---
router.get('/', async (req, res) => {
    try {
        const articole = await Articol.findAll({
            include: [
                {
                    model: Utilizator,
                    as: 'Autor',
                    attributes: ['id', 'numeUtilizator']
                },
                {
                    model: Conferinta,
                    as: 'Conferinta',
                    attributes: ['id', 'titluConf']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(articole);
    } catch (error) {
        console.error("EROARE GET ARTICOLE:", error);
        res.status(500).json({ 
            message: "Eroare la server.", 
            error: error.message
        });
    }
});

// --- RUTA CRITICA: Sterge toate articolele din baza de date si review-urile asociate acestora ---
router.delete('/danger/delete-all', async (req, res) => {
    try {
        
        await Articol.destroy({
            where: {},
            truncate: false, 
            cascade: true
        });

        res.status(200).json({ message: "Toate articolele au fost șterse cu succes." });
    } catch (error) {
        console.error("Eroare la ștergerea totală:", error);
        res.status(500).json({ 
            message: "Eroare la server în timpul ștergerii în masă.",
            error: error.message 
        });
    }
});

// Exportam router-ul pentru a fi montat in fisierul principal
module.exports = router;