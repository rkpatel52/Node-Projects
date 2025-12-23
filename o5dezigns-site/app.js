const express = require("express");
const path = require("path");

const app = express();

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// static files
app.use(express.static(path.join(__dirname, "public")));

// pages
app.get("/", (req, res) => res.render("pages/home", { title: "O5Dezigns" }));
app.get("/about", (req, res) => res.render("pages/about", { title: "About - O5Dezigns" }));
app.get("/services", (req, res) => res.render("pages/services", { title: "Services - O5Dezigns" }));
app.get("/contact", (req, res) => res.render("pages/contact", { title: "Contact - O5Dezigns" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running: http://localhost:${PORT}`));
