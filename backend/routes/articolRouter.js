const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Importăm modelele
const Articol = require('../models/articol');
const Utilizator = require('../models/utilizator');
const Conferinta = require('../models/conferinta');
const Review = require('../models/review');

// --- CONFIGURARE MULTER (Pentru salvarea PDF-urilor) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Folderul creat de tine
    },
    filename: (req, file, cb) => {
        // Salvăm fișierul cu un nume unic: timestamp + nume original
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
// Observă 'upload.single('fisier')' - 'fisier' trebuie să fie numele din FormData în Frontend
router.post('/', upload.single('fisier'), async (req, res) => {
    const conf = await Conferinta.findByPk(req.body.conferintaId);
    if (new Date() > new Date(`${conf.data}T${conf.ora}`)) {
        return res.status(403).json({ message: "Conferința s-a încheiat. Nu se mai pot adăuga articole." });
    }
    try {
        console.log("--- DATE PRIMITE ---");
        console.log("Body:", req.body);
        console.log("File:", req.file);
        // 1. Verificăm dacă fișierul a ajuns la server
        if (!req.file) {
            return res.status(400).json({ message: "Nu a fost încărcat niciun fișier PDF." });
        }

        // 2. Extragem restul datelor trimise lângă fișier
        const { titluArticol, numeArticol, rezumat, autorId, conferintaId } = req.body;

        const titluFinal = titluArticol || numeArticol || req.file.originalname;
        const caleFisier = req.file.filename;

        // 3. Validări de bază
        const autor = await Utilizator.findByPk(autorId);
        if (!autor) return res.status(404).json({ message: "Autorul nu a fost găsit." });

        const conferinta = await Conferinta.findByPk(conferintaId, {
            include: [{ model: Utilizator, as: 'Revieweri' }]
        });
        if (!conferinta) return res.status(404).json({ message: "Conferința nu a fost găsită." });

        // 4. Creăm Articolul în baza de date
        const nouArticol = await Articol.create({
            titluArticol: titluFinal, // Folosim variabila "titluFinal" stabilită mai sus
            rezumat: rezumat || "Fără rezumat", // Siguranță în caz că rezumat e gol
            caleFisier,
            autorId,
            conferintaId,
            versiune: 1,
            status: 'IN_EVALUARE'
        });

        // 5. Alocare automată Revieweri
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
                as: 'Autor', // Verifică dacă acest alias e corect în modelul tău
                attributes: ['numeUtilizator', 'email']
            }]
        });
        res.status(200).json(articole);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la preluarea articolelor." });
    }
});

router.get('/download/:id', async (req, res) => {
    try {
        // 1. Căutăm articolul în baza de date după ID
        const articol = await Articol.findByPk(req.params.id);

        if (!articol) {
            return res.status(404).json({ message: "Articolul nu a fost găsit în baza de date." });
        }

        // 2. Construim calea către fișierul de pe server
        // IMPORTANT: Verifică dacă folderul tău se numește 'uploads' și e în rădăcina backend-ului
        const caleaFizica = path.join(__dirname, '../uploads', articol.caleFisier);

        // 3. Verificăm dacă fișierul chiar există pe disc
        if (fs.existsSync(caleaFizica)) {
            // res.download este o funcție magică Express care:
            // - Spune browserului că urmează un fișier
            // - Setează numele sub care va fi salvat (punem titlul din DB + extensia .pdf)
            return res.download(caleaFizica, articol.titluArticol);
            return res.status(404).json({ message: "Fișierul PDF nu a fost găsit pe server (disk)." });
        }

    } catch (err) {
        console.error("Eroare la descărcare:", err);
        res.status(500).json({ message: "Eroare internă la descărcarea fișierului." });
    }
});

router.put('/:id', upload.single('fisier'), async (req, res) => {
    try {
        const articol = await Articol.findByPk(req.params.id);
        if (!articol) return res.status(404).json({ message: "Articol negăsit" });

        // Actualizăm calea fișierului dacă a fost trimis unul nou
        const updateData = {
            status: 'IN_REEVALUARE', // Resetăm statusul global pentru a reîncepe evaluarea
        };
        
        if (req.file) {
            updateData.caleFisier = req.file.path;
        }

        await articol.update(updateData);

        // OPTIONAL: Resetăm verdictele review-urilor anterioare
        await Review.update(
            { verdict: null, continut: "Așteaptă re-evaluare după modificări." },
            { where: { articolId: articol.id } }
        );

        res.status(200).json(articol);
    } catch (error) {
        res.status(500).json(error);
    }
});


// În backend/routes/articolRouter.js
router.delete('/:id', async (req, res) => {
    try {
        const articol = await Articol.findByPk(req.params.id);
        
        if (!articol) {
            return res.status(404).json({ message: "Articolul nu a fost găsit." });
        }

        // Ștergem articolul (Sequelize va șterge automat și referințele din tabela Review dacă ai setat ON DELETE CASCADE)
        await articol.destroy();

        res.status(200).json({ message: "Articol șters cu succes." });
    } catch (error) {
        console.error("Eroare la ștergere:", error);
        res.status(500).json({ message: "Eroare internă de server." });
    }
});
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
                    as: 'Conferinta', // ADAUGĂ ACEASTĂ LINIE PENTRU A REZOLVA EROAREA
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
            error: error.message // Aceasta îți va arăta eroarea direct în browser dacă mai apare ceva
        });
    }
});

router.delete('/danger/delete-all', async (req, res) => {
    try {
        
        await Articol.destroy({
            where: {},
            truncate: false, // Setează pe true dacă vrei să resetezi ID-urile la 1
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
module.exports = router;