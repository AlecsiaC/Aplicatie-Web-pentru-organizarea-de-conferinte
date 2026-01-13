const { Sequelize } = require('sequelize');

const sequelizeInstance = new Sequelize({
    dialect: 'sqlite',
    storage: './sqlite/database.db',
});

module.exports = sequelizeInstance;