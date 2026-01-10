const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Express is running on Vercel");
});

module.exports = app;
