const mongoose = require("mongoose");
const products= require('./models/productData')
const orderSchema = new mongoose.Schema({
    customerName: String,
    address: String,
    city: String,
    state: String,
    phone: String,
    pin: String,

    totalPrice: Number,
    status: { type: String, default: "Order Placed" },

    items: [
        {
         id: String,
         name: String,
         qty: Number,
         price: Number,       
        }
    ],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
