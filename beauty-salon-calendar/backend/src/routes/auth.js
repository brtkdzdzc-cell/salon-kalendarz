import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../utils/env.js";
import { db } from "../db/db.js";
import { authRequired } from "../middleware/auth.js";

const r = Router();

r.post("/login", async (req, res) => {
  const schema = z.object({ username: z.string().min(1), password: z.string().min(1) });
  const { username, password } = schema.parse(req.body);

  const user = await db
    .prepare("SELECT id, username, password_hash, role FROM users WHERE username = ?")
    .get(username);

  if (!user) return res.status(401).json({ error: "Błędny login lub hasło" });
  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Błędny login lub hasło" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

r.get("/me", authRequired, async (req, res) => {
  const u = await db
    .prepare("SELECT id, username, role, created_at FROM users WHERE id = ?")
    .get(req.user.id);

  res.json({ user: u });
});

export default r;
