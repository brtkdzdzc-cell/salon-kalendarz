import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import vcard from "vcard-parser";
import { db } from "../db/db.js";
import { authRequired } from "../middleware/auth.js";

const r = Router();
r.use(authRequired);

r.get("/", (req, res) => {
  const q = (req.query.q || "").toString().trim();
  let rows;
  if (q) {
    rows = db.prepare(`
      SELECT * FROM clients
      WHERE full_name LIKE ? OR phone LIKE ? OR email LIKE ?
      ORDER BY full_name ASC
      LIMIT 100
    `).all(`%${q}%`, `%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare("SELECT * FROM clients ORDER BY created_at DESC LIMIT 100").all();
  }
  res.json({ clients: rows });
});

r.post("/", (req, res) => {
  const schema = z.object({
    full_name: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    notes: z.string().optional(),
  });
  const data = schema.parse(req.body);

  const info = db.prepare("INSERT INTO clients (full_name, phone, email, notes) VALUES (?,?,?,?)")
    .run(data.full_name, data.phone || null, data.email || null, data.notes || null);
  res.json({ id: info.lastInsertRowid });
});

r.patch("/:id", (req, res) => {
  const schema = z.object({
    full_name: z.string().min(1).optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    notes: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const id = Number(req.params.id);

  const current = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
  if (!current) return res.status(404).json({ error: "Nie znaleziono klientki" });

  db.prepare("UPDATE clients SET full_name=?, phone=?, email=?, notes=? WHERE id=?").run(
    data.full_name ?? current.full_name,
    data.phone ?? current.phone,
    data.email ?? current.email,
    data.notes ?? current.notes,
    id
  );
  res.json({ ok: true });
});

r.get("/:id/history", (req, res) => {
  const id = Number(req.params.id);
  const rows = db.prepare(`
    SELECT a.*, e.name AS employee_name
    FROM appointments a
    JOIN employees e ON e.id = a.employee_id
    WHERE a.client_id = ?
    ORDER BY a.start_at DESC
    LIMIT 200
  `).all(id);
  res.json({ history: rows });
});

// --- Import vCard (.vcf) ---
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

r.post("/import/vcf", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Brak pliku" });

  const text = req.file.buffer.toString("utf-8");
  const cards = vcard.parse(text);
  let created = 0, updated = 0;

  const insert = db.prepare("INSERT INTO clients (full_name, phone, email) VALUES (?,?,?)");
  const findByPhone = db.prepare("SELECT * FROM clients WHERE phone = ? AND phone IS NOT NULL");
  const updateById = db.prepare("UPDATE clients SET full_name=?, email=? WHERE id=?");

  for (const c of cards) {
    const full = (c.fn?.value || c.n?.value || "").toString().trim();
    const phone = (Array.isArray(c.tel) ? c.tel[0]?.value : c.tel?.value || "").toString().trim() || null;
    const email = (Array.isArray(c.email) ? c.email[0]?.value : c.email?.value || "").toString().trim() || null;
    if (!full) continue;

    if (phone) {
      const existing = findByPhone.get(phone);
      if (existing) {
        updateById.run(full || existing.full_name, email || existing.email, existing.id);
        updated++;
        continue;
      }
    }
    insert.run(full, phone, email);
    created++;
  }

  res.json({ ok: true, created, updated });
});

export default r;
