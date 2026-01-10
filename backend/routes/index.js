const express = require("express");
const router = express.Router();

router.use("/admin", require("./admin"));
router.use("/admin/orders", require("./adminorders"));
router.use("/admin/products", require("./adminproduct"));

router.get("/health", (req, res) => {
  res.json({ success: true });
});

module.exports = router;
