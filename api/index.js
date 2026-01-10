const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Views */
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "backend", "views"));

/* Routes */
const routes = require("../backend/routes");
app.use("/", routes);

/* Root route */
app.get("/", (req, res) => {
  res.render("index");
});

/* Fallback */
app.use((req, res) => {
  res.status(404).send("404 - Not Found");
});

module.exports = app;
