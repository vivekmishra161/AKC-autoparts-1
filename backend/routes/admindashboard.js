const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const Order = require("../models/order");

router.get("/dashboard", adminAuth, async (req, res) => {
  try {
    const totalOrders = await Order.count();

    const delivered = await Order.count({
      where: { status: "Delivered" }
    });

    const cancelled = await Order.count({
      where: { status: "Cancelled" }
    });

    const pending = await Order.count({
      where: { status: "Pending" }
    });

    const packed = await Order.count({
      where: { status: "Packed" }
    });

    const deliveredOrders = await Order.findAll({
      where: { status: "Delivered" }
    });

    const totalRevenue = deliveredOrders.reduce(
      (sum, o) => sum + o.totalPrice,
      0
    );

    res.render("admin/dashboard", {
      totalOrders,
      delivered,
      cancelled,
      pending,
      packed,
      totalRevenue
    });

  } catch (err) {
    console.error("Dashboard error:", err);

    res.render("admin/dashboard", {
      totalOrders: 0,
      delivered: 0,
      cancelled: 0,
      pending: 0,
      packed: 0,
      totalRevenue: 0
    });
  }
});

module.exports = router;
