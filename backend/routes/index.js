const express = require("express");
const router = express.Router();

router.use(require("./admin"));
router.use(require("./admindashboard"));
router.use(require("./adminorders"));
router.use(require("./adminproduct"));

module.exports = router;
