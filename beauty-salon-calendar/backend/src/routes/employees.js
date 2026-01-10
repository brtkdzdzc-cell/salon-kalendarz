import { Router } from "express";
import { z } from "zod";
import { db } from "../db/db.js";
import { authRequired } from "../middleware/auth.js";

const r = Router();
r.use(authRequired);

r.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM employees WHERE active = 1 ORDER BY id ASC").all();
  res.json({ employees: rows });
});

r.get("/all", (req, res) => {
  const rows = db.prepare("SELECT * FROM employees ORDER BY id ASC").all();
  res.json({ employees: rows });
});

r.post("/", (req, res) => {
  const schema = z.object({ name: z.string().min(1), color: z.string().optional() });
  const { name, color } = schema.parse(req.body);
  const info = db.prepare("INSERT INTO employees (name, color) VALUES (?,?)").run(name, color || null);
  res.json({ id: info.lastInsertRowid });
});

r.patch("/:id", (req, res) => {
  const schema = z.object({ name: z.string().min(1).optional(), color: z.string().optional(), active: z.number().int().optional() });
  const data = schema.parse(req.body);
  const id = Number(req.params.id);

  const current = db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
  if (!current) return res.status(404).json({ error: "Nie znaleziono pracownika" });

  db.prepare("UPDATE employees SET name=?, color=?, active=? WHERE id=?").run(
    data.name ?? current.name,
    data.color ?? current.color,
    data.active ?? current.active,
    id
  );
  res.json({ ok: true });
});

export default r;
