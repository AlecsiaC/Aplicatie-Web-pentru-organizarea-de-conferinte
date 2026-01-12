const sequelize = require('../sequelize');
const { DataTypes } = require('sequelize');

const Utilizator = sequelize.define('utilizator', {
    numeUtilizator: {
        type: DataTypes.STRING,
        allowNull: false
    },
     email:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    parola:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    rol: {
        type: DataTypes.ENUM,
        allowNull: false,
        values: ['AUTOR', 'ORGANIZATOR', 'REVIEWER']
    }
});

module.exports = Utilizator;