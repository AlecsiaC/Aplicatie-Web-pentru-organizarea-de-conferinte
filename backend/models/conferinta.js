const sequelize = require('../sequelize');
const { DataTypes } = require('sequelize');

const Conferinta = sequelize.define('conferinta', {
    titluConf: {
        type: DataTypes.STRING,
        allowNull: false
    },
     descriere: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    data: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    ora: {
        type: DataTypes.TIME,
        allowNull: false
    },
    // organizatorId: {
    //     type: DataTypes.INTEGER,
    //     allowNull: false,
    // },
    status: {
        type: DataTypes.ENUM,
        allowNull: false,
        values: ['PLANIFICATA', 'IN_DESFASURARE', 'FINALIZATA', 'ANULATA'],
        defaultValue: 'PLANIFICATA'
    }
});

module.exports = Conferinta;