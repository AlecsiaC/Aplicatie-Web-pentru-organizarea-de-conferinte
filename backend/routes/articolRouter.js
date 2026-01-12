const express = require('express');
const router = express.Router();

// Importăm toate modelele necesare
const Articol = require('../models/articol');
const Utilizator = require('../models/utilizator');
const Conferinta = require('../models/conferinta');
const Review = require('../models/review');

// RUTA POST: Autorul propune un articol nou la o conferință + ALOCARE AUTOMATĂ
router.post('/articole', async (req, res) => {
    try {
        // 1. Extragem datele din cerere
        const { titluArticol, rezumat, caleFisier, autorId, conferintaId } = req.body;

        // 2. Validare: Există Autorul?
        const autor = await Utilizator.findByPk(autorId);
        if (!autor) {
            return res.status(404).json({ message: "Autorul nu a fost găsit." });
        }
        if (autor.rol !== 'AUTOR') {
             return res.status(400).json({ message: "Doar autorii pot trimite articole." });
        }

        // 3. Validare: Există Conferința? + Aducem și Reviewerii ei (OPTIMIZARE)
        // Aici am combinat validarea cu pregătirea pentru alocare
        const conferinta = await Conferinta.findByPk(conferintaId, {
            include: [{
                model: Utilizator,
                as: 'Revieweri' // Folosim alias-ul definit în server.js
            }]
        });

        if (!conferinta) {
            return res.status(404).json({ message: "Conferința nu a fost găsită." });
        }

        // 4. Creăm Articolul
        const nouArticol = await Articol.create({
            titluArticol,
            rezumat,
            caleFisier,
            autorId,
            conferintaId,
            versiune: 1,
            status: 'IN_EVALUARE'
        });

        // ---------------------------------------------------------
        // 5. ALGORITMUL DE ALOCARE AUTOMATĂ (Persoana 3)
        // ---------------------------------------------------------
        
        // Verificăm dacă conferința are revieweri alocați
        if (conferinta.Revieweri && conferinta.Revieweri.length > 0) {
            const listaRevieweri = conferinta.Revieweri;

            // A. Amestecăm lista (Shuffle simplu)
            const revieweriAmestecati = listaRevieweri.sort(() => 0.5 - Math.random());

            // B. Luăm primii 2 (sau toți, dacă sunt mai puțin de 2)
            const ceiAlesi = revieweriAmestecati.slice(0, 2);

            // C. Creăm intrările în tabelul de Review-uri
            for (const rev of ceiAlesi) {
                await Review.create({
                    reviewerId: rev.id,      
                    articolId: nouArticol.id, 
                    verdict: null,           // NULL permis acum (în așteptare)
                    continut: ""             
                });
                console.log(`[ALOCARE] Reviewerul ${rev.numeUtilizator} (ID: ${rev.id}) alocat la articolul ${nouArticol.id}`);
            }
        } else {
            console.warn("ATENTIE: Nu există revieweri alocați conferinței! Articolul nu are corectori.");
        }

        res.status(201).json({ 
            message: "Articol trimis și revieweri alocați cu succes!", 
            articol: nouArticol 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la trimiterea articolului." });
    }
});

// RUTA GET: Vezi articolele unui autor
router.get('/articole/autor/:idAutor', async (req, res) => {
    try {
        const articole = await Articol.findAll({
            where: { autorId: req.params.idAutor }
        });
        res.status(200).json(articole);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare server." });
    }
});

// RUTA PUT: Autorul încarcă o nouă versiune a articolului
router.put('/articole/:idArticol', async (req, res) => {
    try {
        const { idArticol } = req.params;
        const { titluArticol, rezumat, caleFisier } = req.body;

        const articol = await Articol.findByPk(idArticol);

        if (!articol) {
            return res.status(404).json({ message: "Articolul nu a fost găsit." });
        }
        
        await articol.update({
            titluArticol: titluArticol || articol.titluArticol,
            rezumat: rezumat || articol.rezumat,
            caleFisier: caleFisier || articol.caleFisier,
            versiune: articol.versiune + 1,
            status: 'IN_EVALUARE'
        });

        res.status(200).json({ 
            message: `Versiunea ${articol.versiune} a fost încărcată cu succes!`, 
            articol 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la actualizarea articolului." });
    }
});

// RUTA GET: Returnează toate articolele unei conferințe specifice
// URL: http://localhost:3000/api/conferinte/:idConferinta/articole
router.get('/conferinte/:idConferinta/articole', async (req, res) => {
    try {
        const idConferinta = req.params.idConferinta;

        // 1. Verificăm dacă conferința există (opțional, dar recomandat)
        const conferinta = await Conferinta.findByPk(idConferinta);
        if (!conferinta) {
            return res.status(404).json({ message: "Conferința nu a fost găsită." });
        }

        // 2. Căutăm articolele care au conferintaId egal cu cel din URL
        const articole = await Articol.findAll({
            where: {
                conferintaId: idConferinta
            },
            // Opțional: Putem include și date despre autor ca să știm cine a scris
            include: [{
                model: Utilizator,
                as: 'Autor', // Presupunând că Sequelize a generat acest alias implicit (sau 'autor')
                             // Dacă dă eroare, verificăm alias-ul. De obicei e numele modelului.
                attributes: ['numeUtilizator', 'email']
            }]
        });

        res.status(200).json(articole);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Eroare la preluarea articolelor conferinței." });
    }
});

module.exports = router;