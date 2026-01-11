import { Router } from "express";
import { z } from "zod";
import { db } from "../db/db.js";
import { authRequired } from "../middleware/auth.js";

const r = Router();
r.use(authRequired);

r.get("/", async (req, res) => {
  const rows = await db.prepare("SELECT * FROM employees WHERE active = TRUE ORDER BY id ASC").all();
  res.json({ employees: rows });
});

r.get("/all", async (req, res) => {
  const rows = await db.prepare("SELECT * FROM employees ORDER BY id ASC").all();
  res.json({ employees: rows });
});

r.post("/", async (req, res) => {
  const schema = z.object({ name: z.string().min(1), color: z.string().optional() });
  const { name, color } = schema.parse(req.body);

  const info = await db
    .prepare("INSERT INTO employees (name, color) VALUES (?,?) RETURNING id")
    .run(name, color || null);

  res.json({ id: info.lastInsertRowid });
});

r.patch("/:id", async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    color: z.string().optional(),
    active: z.union([z.boolean(), z.number().int()]).optional(),
  });
  const data = schema.parse(req.body);
  const id = Number(req.params.id);

  const current = await db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
  if (!current) return res.status(404).json({ error: "Nie znaleziono pracownika" });

  // Postgres: active to BOOLEAN w init_pg.js
  const nextActive =
    typeof data.active === "boolean"
      ? data.active
      : typeof data.active === "number"
      ? data.active === 1
      : current.active;

  await db.prepare("UPDATE employees SET name=?, color=?, active=? WHERE id=?").run(
    data.name ?? current.name,
    data.color ?? current.color,
    nextActive,
    id
  );

  res.json({ ok: true });
});

export default r;
