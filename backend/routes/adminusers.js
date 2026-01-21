const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const User = require("../models/user");

// ============================
// ADMIN: VIEW ALL USERS
// ============================
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.findAll({
      order: [["createdAt", "DESC"]]
    });

    res.render("admin/users", { users });

  } catch (err) {
    console.log("Admin users error:", err);
    res.render("admin/users", { users: [] });
  }
});

module.exports = router;
