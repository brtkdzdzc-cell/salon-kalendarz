import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "../db/db.js";
import { authRequired, adminOnly } from "../middleware/auth.js";

const r = Router();
r.use(authRequired, adminOnly);

r.get("/users", (req, res) => {
  const rows = db.prepare("SELECT id, username, role, created_at FROM users ORDER BY id DESC").all();
  res.json({ users: rows });
});

r.post("/users", (req, res) => {
  const schema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
    role: z.enum(["admin", "user"]).default("user"),
  });
  const { username, password, role } = schema.parse(req.body);

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) return res.status(400).json({ error: "Taki login już istnieje" });

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?,?,?)").run(username, hash, role);
  res.json({ id: info.lastInsertRowid });
});

r.patch("/users/:id/password", (req, res) => {
  const schema = z.object({ password: z.string().min(6) });
  const { password } = schema.parse(req.body);
  const id = Number(req.params.id);
  const hash = bcrypt.hashSync(password, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, id);
  res.json({ ok: true });
});

export default r;
