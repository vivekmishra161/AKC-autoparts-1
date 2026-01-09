const express = require('express');
const router = express.Router();

const adminAuth = require('../middleware/adminAuth');
const Order = require('../models/order');

router.get('/orders', adminAuth, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.render('admin/orders', { orders });
});

router.post("/update-order-status", async (req, res) => {
  try {
    const { orderId, status } = req.body;

    await Order.findByIdAndUpdate(orderId, {
      status
    });

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});

module.exports = router;
