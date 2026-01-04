import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon works fine with this on serverless
});

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v || "");
}

function clean(v) {
  return String(v ?? "").trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const name = clean(req.body?.name);
    const email = clean(req.body?.email);
    const phone = clean(req.body?.phone);
    const subject = clean(req.body?.subject);
    const message = clean(req.body?.message);

    // ✅ server-side validation (always do this)
    const errors = {};
    if (!name || name.length < 2) errors.name = "Please enter your name (min 2 chars).";
    if (!isEmail(email)) errors.email = "Please enter a valid email.";
    if (!subject || subject.length < 3) errors.subject = "Subject must be at least 3 characters.";
    if (!message || message.length < 10) errors.message = "Message must be at least 10 characters.";

    // Phone is optional, but if user enters something, validate lightly
    if (phone && phone.length < 7) errors.phone = "Please enter a valid phone number.";

    if (Object.keys(errors).length) {
      return res.status(400).json({ ok: false, errors:"Error" });
    }

    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;

    const userAgent = req.headers["user-agent"] || null;

    const q = `
      INSERT INTO contact_messages (name, email, phone, subject, message, ip, user_agent)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, created_at
    `;

    const values = [name, email, phone || null, subject, message, ip, userAgent];

    const result = await pool.query(q, values);

    return res.status(200).json({
      ok: true,
      message: "Saved successfully",
      id: result.rows[0].id,
      createdAt: result.rows[0].created_at,
    });
  } catch (err) {
    console.error("CONTACT_SAVE_ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}