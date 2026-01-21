const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Review = sequelize.define("Review", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  productId: {
    type: DataTypes.STRING,
    allowNull: false
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  userName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  rating: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    validate: { min: 1, max: 5 }
  },

  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }

}, {
  tableName: "reviews",
  timestamps: true
});

module.exports = Review;
