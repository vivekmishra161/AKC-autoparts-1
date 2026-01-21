const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    customerName: {
      type: DataTypes.STRING,
      allowNull: false
    },

    address: {
      type: DataTypes.STRING,
      allowNull: false
    },

    city: {
      type: DataTypes.STRING,
      allowNull: false
    },

    state: {
      type: DataTypes.STRING,
      allowNull: false
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },

    pin: {
      type: DataTypes.STRING,
      allowNull: false
    },

    totalPrice: {
      type: DataTypes.FLOAT,
      allowNull: false
    },

    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false
    },

    paymentStatus: {
      type: DataTypes.STRING,
      defaultValue: "Pending"
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: "Pending"
    },

    // ⭐ MOST IMPORTANT FIX
    items: {
      type: DataTypes.JSONB,
      allowNull: false
    }
  },
  {
    tableName: "orders",
    timestamps: true
  }
);

module.exports = Order;
