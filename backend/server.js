const express = require("express");
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
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

// Relații (Păstrate exact cum le-ai scris tu, sunt corecte)
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

// --- MONTARE RUTE (MODIFICAT AICI) ---
// Acum rutele vor fi prefixate clar
app.use('/api/utilizatori', utilizatorRouter);
app.use('/api/conferinte', conferintaRouter);
app.use('/api/articole', articolRouter);
app.use('/api/reviews', reviewRouter);

// Rută test (ca să vezi în browser dacă serverul chiar e viu)
app.get('/api/health', (req, res) => res.json({ status: "running" }));

// Error Handler
app.use((err, req, res, next) => {
    console.error("[ERROR]:", err);
    res.status(500).json({ message: "Eroare internă server" });
});

// Kickstart
sequelize.sync().then(() => {
    console.log("✅ Database & tables synced!");
    app.listen(port, () => {
        console.log(`🚀 Serverul a pornit pe portul ${port}`);
    });
}).catch(err => {
    console.error("❌ Eroare la sincronizarea bazei de date:", err);
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
