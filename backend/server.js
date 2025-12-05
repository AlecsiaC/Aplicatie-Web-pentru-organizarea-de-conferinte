// Express Initialisation
const express = require("express");
const app = express();
const port = 3000;

// Sequelize Initialisation
const sequelize = require("./sequelize");

// Import created models
const Articol = require("./models/articol");
const Conferinta = require("./models/conferinta");
const Review = require("./models/review");
const Utilizator = require("./models/utilizator");

const conferintaRouter = require('./routes/conferintaRouter');
const utilizatorRouter = require('./routes/utilizatorRouter');
const articolRouter = require('./routes/articolRouter');
const reviewRouter = require('./routes/reviewRouter');

// Define entities relationship
// -------------------- 1. UTILIZATOR <-> CONFERINTA (ORGANIZATOR) --------------------
Utilizator.hasMany(Conferinta, { foreignKey: 'organizatorId', as: 'ConferinteOrganizate' });
Conferinta.belongsTo(Utilizator, { foreignKey: 'organizatorId', as: 'Organizator' });

// -------------------- 2. UTILIZATOR <-> ARTICOL (AUTOR) --------------------
Utilizator.hasMany(Articol, { foreignKey: 'autorId', as: 'ArticoleTrimise' });
Articol.belongsTo(Utilizator, { foreignKey: 'autorId', as: 'Autor' });

// -------------------- 3. ARTICOL <-> CONFERINTA --------------------
Conferinta.hasMany(Articol, { foreignKey: 'conferintaId', as: 'Articole' });
Articol.belongsTo(Conferinta, { foreignKey: 'conferintaId', as: 'Conferinta' });

// -------------------- 4. REVIEW <-> ARTICOL & UTILIZATOR (REVIEWER) --------------------
// Articol primește review-uri
Articol.hasMany(Review, { foreignKey: 'articolId', as: 'Reviewuri' });
Review.belongsTo(Articol, { foreignKey: 'articolId', as: 'Articol' });

// Utilizator (Reviewer) scrie review-uri
Utilizator.hasMany(Review, { foreignKey: 'reviewerId', as: 'ReviewuriScrise' });
Review.belongsTo(Utilizator, { foreignKey: 'reviewerId', as: 'Reviewer' });


// Express middleware
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());
app.use('/api', conferintaRouter);
app.use('/api', utilizatorRouter);
app.use('/api', articolRouter);
app.use('/api', reviewRouter);

// Create a middleware to handle 500 status errors.
app.use((err, req, res, next) => {
  console.error("[ERROR]:" + err);
  res.status(500).json({ message: "500 - Server Error" });
});

// Kickstart the Express aplication
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Database & tables synced!");
    app.listen(port, () => {
      console.log("The server is running on http://localhost/:" + port);
    });
  })
  .catch((err) => {
    console.error("Unable to sync database:", err);
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


