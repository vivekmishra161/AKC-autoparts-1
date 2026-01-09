const express = require('express');
const router = express.Router();

const adminAuth = require('../middleware/adminAuth');
const products = require('../models/productData');

router.get('/products', adminAuth, (req, res) => {
  res.render('admin/products', { products });
});

module.exports = router;
