// app.js
require("dotenv").config();

const express = require("express");
const path = require("path");
const pool = require("./db");

const app = express();

// body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// static
app.use(express.static(path.join(__dirname, "public")));

// ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// pages
app.get("/", (req, res) => res.render("pages/home", { title: "O5Dezigns" }));
app.get("/about", (req, res) => res.render("pages/about", { title: "About - O5Dezigns" }));
app.get("/services", (req, res) => res.render("pages/services", { title: "Services - O5Dezigns" }));
app.get("/contact", (req, res) => res.render("pages/contact", { title: "Contact - O5Dezigns" }));

// API
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ ok: false, error: "Please fill all required fields." });
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return res.status(400).json({ ok: false, error: "Invalid email." });
    }

    await pool.query(
      `INSERT INTO contact_messages (name, email, phone, subject, message, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        phone ? String(phone).trim() : null,
        subject.trim(),
        message.trim(),
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || null,
        req.headers["user-agent"] || null,
      ]
    );

    return res.json({ ok: true, message: "Saved successfully" });
  } catch (err) {
    console.error("CONTACT_API_ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error. Try again." });
  }
});

/**
 * ✅ Local only
 * On Vercel, DO NOT listen.
 */
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Running: http://localhost:${PORT}`));
}

// ✅ Export for Vercel
module.exports = app;
