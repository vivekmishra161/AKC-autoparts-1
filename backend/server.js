const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend root is working");
});

app.get("/api/health", (req, res) => {
  res.json({ success: true });
});

module.exports = app;
