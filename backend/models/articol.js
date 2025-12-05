const sequelize = require('../sequelize');
const { DataTypes } = require('sequelize');

const Articol = sequelize.define('articol', {
    titluArticol: {
        type: DataTypes.STRING,
        allowNull: false
    },
     rezumat: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    // autorId: {
    //     type: DataTypes.INTEGER,
    //     allowNull: false,
    // }
    caleFisier:{
        type: DataTypes.STRING,
        allowNull: false
    },
    dataIncarcare:{
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM,
        values: ['IN_EVALUARE', 'ACCEPTAT', 'RESPINS', 'NECESITA_MODIFICARI'],
        defaultValue: 'IN_EVALUARE'
    }
});

module.exports = Articol;