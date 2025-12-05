const { Sequelize } = require('sequelize');

// 2. Acum puteți folosi constructorul importat (cu S mare)
const sequelizeInstance = new Sequelize({
    dialect: 'sqlite',
    storage: './sqlite/database.db',
    // Adaugati logare: false sau logare: console.log pentru a vedea interogarile
});

// 3. Exportați instanța creată
module.exports = sequelizeInstance;