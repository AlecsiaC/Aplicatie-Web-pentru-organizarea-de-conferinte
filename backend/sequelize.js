const { Sequelize } = require('sequelize'); // Importam clasa Sequelize din pachet

const sequelizeInstance = new Sequelize({
    dialect: 'sqlite',
    storage: './sqlite/database.db',
}); // Initializam instanta Sequelize pentru configurarea bazei de date

module.exports = sequelizeInstance; // Exportam instanta pentru a fi utilizata in server.js si in definirea modelelor