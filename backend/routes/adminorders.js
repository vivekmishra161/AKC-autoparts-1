const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const Order = require("../models/order");

// ============================
// ADMIN: VIEW ALL ORDERS
// ============================
router.get("/orders", adminAuth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [["createdAt", "DESC"]]
    });

    res.render("admin/orders", { orders });

  } catch (err) {
    console.log("Admin orders error:", err);
    res.render("admin/orders", { orders: [] });
  }
});

// ============================
// ADMIN: UPDATE ORDER STATUS
// ============================
router.post("/update-order-status", async (req, res) => {
  try {
    const { orderId, status } = req.body;

    await Order.update(
      { status },
      {
        where: { id: orderId }
      }
    );

    res.json({ success: true });

  } catch (err) {
    console.log("Update order error:", err);
    res.json({ success: false });
  }
});

module.exports = router;
