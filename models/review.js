const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  userName: { type: String, required: true },
  message: { type: String, required: true },
  rating: { type: Number, default: 5 },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Review", reviewSchema);
