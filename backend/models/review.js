const sequelize = require('../sequelize');
const { DataTypes } = require('sequelize');

const Review = sequelize.define('review', {
     continut: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    verdict:{
        type: DataTypes.ENUM,
        values: ['ACCEPTAT', 'RESPINS', 'NECESITA_MODIFICARI'],
        allowNull: false
    },
    dataReview:{
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Review;