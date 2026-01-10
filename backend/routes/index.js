const express = require("express");
const router = express.Router();

/* Test route */
router.get("/health", (req, res) => {
  res.json({ status: "routes working" });
});

/* Import admin routes */
router.use("/admin", require("./admin"));
router.use("/admin/dashboard", require("./admindashboard"));
router.use("/admin/orders", require("./adminorders"));
router.use("/admin/product", require("./adminproduct"));

module.exports = router;
