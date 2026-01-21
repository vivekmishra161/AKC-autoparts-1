const express = require("express");
const router = express.Router();

const User = require("../models/user");   // lowercase file name
const Order = require("../models/order");

// ============================
// ADMIN LOGIN PAGE
// ============================
router.get("/login", (req, res) => {
  res.render("admin/login");
});

// ============================
// ADMIN LOGIN HANDLER (SQL)
// ============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({
      where: {
        email,
        password,
        role: "admin"
      }
    });

    if (!admin) {
      return res.redirect("/admin/login");
    }

    req.session.user = {
      id: admin.id,          // ✅ SQL id
      name: admin.name,
      email: admin.email,
      role: admin.role
    };

    res.redirect("/admin/dashboard");

  } catch (err) {
    console.log("Admin login error:", err);
    res.redirect("/admin/login");
  }
});

// ============================
// ADMIN LOGOUT
// ============================
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

// ============================
// ADMIN UPDATE ORDER STATUS (SQL)
// ============================
router.post("/update-order-status", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "admin") {
      return res.status(403).json({ success: false });
    }

    const { orderId, status } = req.body;

    await Order.update(
      { status },
      { where: { id: orderId } }
    );

    res.json({ success: true });

  } catch (err) {
    console.log("Admin Update Status Error:", err);
    res.json({ success: false });
  }
});

module.exports = router;
