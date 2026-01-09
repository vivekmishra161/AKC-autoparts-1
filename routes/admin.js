const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/order');

// Admin login page
router.get('/login', (req, res) => {
  res.render('admin/login');
});

// Admin login handler
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const admin = await User.findOne({
    email,
    password,
    role: 'admin'
  });

  if (!admin) {
    return res.redirect('/admin/login');
  }

  req.session.user = {
    id: admin._id,
    role: admin.role
  };

  res.redirect('/admin/dashboard');
});

// Admin logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

/* =========================
   UPDATE ORDER STATUS API
   ========================= */
router.post('/update-order-status', async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({ success: false });
    }

    const { orderId, status } = req.body;

    await Order.findByIdAndUpdate(orderId, {
      status
    });

    res.json({ success: true });

  } catch (err) {
    console.log("Admin Update Status Error:", err);
    res.json({ success: false });
  }
});

module.exports = router;
