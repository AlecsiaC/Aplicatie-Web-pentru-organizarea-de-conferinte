/**
 * RELATII INTRE CLASE:
 * 1. Utilizator - Conferinta: 
 * - Un Organizator are mai multe Conferinte (1:N).
 * - Conferintele au mai multi Revieweri (N:N prin 'ConferintaRevieweri').
 * - Conferintele au mai multi Participanti (N:N prin 'Participari').
 * 2. Utilizator - Articol:
 * - Un Autor poate trimite mai multe Articole (1:N).
 * 3. Conferinta - Articol:
 * - O Conferinta gazduieste mai multe Articole (1:N).
 * 4. Articol - Review:
 * - Un Articol primeste mai multe Review-uri de la diferiti Revieweri (1:N).
 * - Exista si o relatie N:N intre Articol si Utilizator (Revieweri) prin tabela 'review'.
 */

const express = require("express");
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware pentru securitate, parsare JSON si URL-encoded
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sequelize & Modele
const sequelize = require("./sequelize");
const Articol = require("./models/articol");
const Conferinta = require("./models/conferinta");
const Review = require("./models/review");
const Utilizator = require("./models/utilizator");

// Import Rute
const conferintaRouter = require('./routes/conferintaRouter');
const utilizatorRouter = require('./routes/utilizatorRouter');
const articolRouter = require('./routes/articolRouter');
const reviewRouter = require('./routes/reviewRouter');

// Relații
Utilizator.hasMany(Conferinta, { foreignKey: 'organizatorId', as: 'ConferinteOrganizate' });
Conferinta.belongsTo(Utilizator, { foreignKey: 'organizatorId', as: 'Organizator' });
Conferinta.belongsToMany(Utilizator, { through: 'ConferintaRevieweri', as: 'Revieweri' });
Utilizator.belongsToMany(Conferinta, { through: 'ConferintaRevieweri', as: 'ConferinteDeReview' });
Conferinta.belongsToMany(Utilizator, { through: 'Participari', as: 'Participanti' });
Utilizator.belongsToMany(Conferinta, { through: 'Participari', as: 'ConferinteLaCareParticip' });
Utilizator.hasMany(Articol, { foreignKey: 'autorId', as: 'ArticoleTrimise' });
Articol.belongsTo(Utilizator, { foreignKey: 'autorId', as: 'Autor' });
Conferinta.hasMany(Articol, { foreignKey: 'conferintaId', as: 'Articole' });
Articol.belongsTo(Conferinta, { foreignKey: 'conferintaId', as: 'Conferinta' });
Articol.hasMany(Review, { foreignKey: 'articolId', as: 'Reviewuri' });
Review.belongsTo(Articol, { foreignKey: 'articolId', as: 'Articol' });
Utilizator.hasMany(Review, { foreignKey: 'reviewerId', as: 'ReviewuriScrise' });
Review.belongsTo(Utilizator, { foreignKey: 'reviewerId', as: 'Reviewer' });

// Relatie N:N intre Articole si Revieweri prin tabela intermediara 'review'
Articol.belongsToMany(Utilizator, { 
    through: 'review',
    as: 'Revieweri', 
    foreignKey: 'articolId',
    otherKey: 'reviewerId'
});

// MONTARE RUTE
app.use('/api/utilizatori', utilizatorRouter);
app.use('/api/conferinte', conferintaRouter);
app.use('/api/articole', articolRouter);
app.use('/api/reviews', reviewRouter);

// Rută test
app.get('/api/health', (req, res) => res.json({ status: "running" }));

// Error Handler
app.use((err, req, res, next) => {
    console.error("[ERROR]:", err);
    res.status(500).json({ message: "Eroare internă server" });
});

// Kickstart
sequelize.sync().then(() => {
    console.log("Database & tables synced!");
    app.listen(port, () => {
        console.log(`Serverul a pornit pe portul ${port}`);
    });
}).catch(err => {
    console.error("Eroare la sincronizarea bazei de date:", err);
});


// ruta /create pt crearea tabelului
app.get("/create", async (req, res, next) => {
  try {
    await sequelize.sync({ force: true });
    res.status(201).json({ message: "Database created with the models." });
  } catch (err) {
    next(err);
  }
});
