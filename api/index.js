const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

/* ✅ Root route (VERY IMPORTANT for Vercel preview) */
app.get("/", (req, res) => {
  res.render("index");
});

/* ✅ Your existing routes */
const routes = require("../backend/routes");
app.use("/", routes);


/* ✅ Fallback for unknown routes (prevents 404 on Vercel) */
app.use((req, res) => {
  res.status(404).render("index");
});

module.exports = app;
