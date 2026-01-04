const express = require("express");
const path = require("path");
const pool = require("./db");
const app = express();

// ✅ to read form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// static files
app.use(express.static(path.join(__dirname, "public")));
// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// pages
app.get("/", (req, res) => res.render("pages/home", { title: "O5Dezigns" }));
app.get("/about", (req, res) => res.render("pages/about", { title: "About - O5Dezigns" }));
app.get("/services", (req, res) => res.render("pages/services", { title: "Services - O5Dezigns" }));
app.get("/contact", (req, res) => res.render("pages/contact", { title: "Contact - O5Dezigns" }));
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // ✅ basic server validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ ok: false, error: "Please fill all required fields." });
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return res.status(400).json({ ok: false, error: "Invalid email." });
    }

    // optional: normalize phone (intl-tel-input can also give you full number)
    const phoneSafe = phone ? String(phone).trim() : null;

    await pool.query(
      `INSERT INTO contact_messages (name, email, phone, subject, message, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        phoneSafe,
        subject.trim(),
        message.trim(),
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || null,
        req.headers["user-agent"] || null,
      ]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Server error. Try again." });
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running: http://localhost:${PORT}`));

require("dotenv").config();

const http = require("http");
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

const requestHandler = async (req, res) => {
  const result = await sql`SELECT version()`;
  const { version } = result[0];
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(version);
};

http.createServer(requestHandler).listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});