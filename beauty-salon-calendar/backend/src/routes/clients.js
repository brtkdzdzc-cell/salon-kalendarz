import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import vcard from "vcard-parser";
import { db } from "../db/db.js";
import { authRequired } from "../middleware/auth.js";

const r = Router();
r.use(authRequired);

/**
 * GET /clients?q=...
 * Szukanie po imieniu lub telefonie (bez emaila)
 */
r.get("/", (req, res) => {
  const q = (req.query.q || "").toString().trim();
  let rows;

  if (q) {
    rows = db
      .prepare(
        `
        SELECT * FROM clients
        WHERE full_name LIKE ? OR phone LIKE ?
        ORDER BY full_name ASC
        LIMIT 100
      `
      )
      // UWAGA: SQL ma 2 znaki ?, więc przekazujemy 2 parametry
      .all(`%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare("SELECT * FROM clients ORDER BY created_at DESC LIMIT 100").all();
  }

  res.json({ clients: rows });
});

/**
 * POST /clients
 * Tworzenie klientki (bez emaila)
 */
r.post("/", (req, res) => {
  const schema = z.object({
    full_name: z.string().min(1),
    phone: z.string().optional(),
    notes: z.string().optional(),
  });

  const data = schema.parse(req.body);

  const info = db
    .prepare("INSERT INTO clients (full_name, phone, notes) VALUES (?,?,?)")
    .run(data.full_name, data.phone || null, data.notes || null);

  res.json({ id: info.lastInsertRowid });
});

/**
 * PATCH /clients/:id
 * Edycja klientki (bez emaila)
 */
r.patch("/:id", (req, res) => {
  const schema = z.object({
    full_name: z.string().min(1).optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
  });

  const data = schema.parse(req.body);
  const id = Number(req.params.id);

  const current = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
  if (!current) return res.status(404).json({ error: "Nie znaleziono klientki" });

  db.prepare("UPDATE clients SET full_name=?, phone=?, notes=? WHERE id=?").run(
    data.full_name ?? current.full_name,
    data.phone ?? current.phone,
    data.notes ?? current.notes,
    id
  );

  res.json({ ok: true });
});

/**
 * GET /clients/:id/history
 * Historia zabiegów klientki
 */
r.get("/:id/history", (req, res) => {
  const id = Number(req.params.id);

  const rows = db
    .prepare(
      `
      SELECT a.*, e.name AS employee_name
      FROM appointments a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.client_id = ?
      ORDER BY a.start_at DESC
      LIMIT 200
    `
    )
    .all(id);

  res.json({ history: rows });
});

// --- Import vCard (.vcf) ---
// Importujemy tylko: imię/nazwę + telefon. Email ignorujemy całkowicie.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

r.post("/import/vcf", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Brak pliku" });

  const text = req.file.buffer.toString("utf-8");
  const cards = vcard.parse(text);

  let created = 0,
    updated = 0;

  const insert = db.prepare("INSERT INTO clients (full_name, phone, notes) VALUES (?,?,?)");
  const findByPhone = db.prepare("SELECT * FROM clients WHERE phone = ? AND phone IS NOT NULL");
  const updateById = db.prepare("UPDATE clients SET full_name=? WHERE id=?");

  for (const c of cards) {
    const full = (c.fn?.value || c.n?.value || "").toString().trim();
    const phone = (Array.isArray(c.tel) ? c.tel[0]?.value : c.tel?.value || "").toString().trim() || null;

    if (!full) continue;

    if (phone) {
      const existing = findByPhone.get(phone);
      if (existing) {
        updateById.run(full || existing.full_name, existing.id);
        updated++;
        continue;
      }
    }

    insert.run(full, phone, null);
    created++;
  }

  res.json({ ok: true, created, updated });
});

export default r;
