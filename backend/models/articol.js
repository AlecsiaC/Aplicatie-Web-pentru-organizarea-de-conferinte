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
    caleFisier:{ //Aici stocam numele fisierului sau link-ul
        type: DataTypes.STRING,
        allowNull: false
    },
    versiune: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull:false
    },
    articolInitialId: { //Grupare versiuni
        type: DataTypes.INTEGER,
        allowNull: true
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