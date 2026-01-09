const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  customerName: String,
  address: String,
  city: String,
  state: String,
  phone: String,
  pin: String,

  totalPrice: Number,

  paymentMethod: {
    type: String,
    enum: ["COD", "UPI"],
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ["Pending Verification", "Paid", "Failed"],
    default: "Pending Verification"
  },

  status: {
    type: String,
    enum: ["Pending", "Packed", "Delivered", "Cancelled"],
    default: "Pending"
  },

  items: [
    {
      id: String,
      name: String,
      qty: Number,
      price: Number
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
