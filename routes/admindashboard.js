const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');

router.get('/dashboard', adminAuth, (req, res) => {
  res.render('admin/dashboard');
});

module.exports = router;
