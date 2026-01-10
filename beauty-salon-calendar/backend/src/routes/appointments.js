import { Router } from "express";
import { z } from "zod";
import { db } from "../db/db.js";
import { authRequired } from "../middleware/auth.js";

const r = Router();
r.use(authRequired);

function overlaps(employee_id, start_at, end_at, ignoreId = null) {
  const q = `
    SELECT id FROM appointments
    WHERE employee_id = ?
      AND NOT (end_at <= ? OR start_at >= ?)
      ${ignoreId ? "AND id != ?" : ""}
    LIMIT 1
  `;
  const stmt = db.prepare(q);
  const row = ignoreId ? stmt.get(employee_id, start_at, end_at, ignoreId) : stmt.get(employee_id, start_at, end_at);
  return !!row;
}

r.get("/", (req, res) => {
  const schema = z.object({
    start: z.string().min(1),
    end: z.string().min(1),
    employeeId: z.string().optional(),
  });
  const { start, end, employeeId } = schema.parse(req.query);

  const params = [start, end];
  let rows;
  if (employeeId) {
    rows = db.prepare(`
      SELECT a.*, c.full_name AS client_name, c.phone AS client_phone, e.name AS employee_name, e.color AS employee_color
      FROM appointments a
      JOIN clients c ON c.id = a.client_id
      JOIN employees e ON e.id = a.employee_id
      WHERE a.start_at >= ? AND a.start_at < ? AND a.employee_id = ?
      ORDER BY a.start_at ASC
    `).all(start, end, Number(employeeId));
  } else {
    rows = db.prepare(`
      SELECT a.*, c.full_name AS client_name, c.phone AS client_phone, e.name AS employee_name, e.color AS employee_color
      FROM appointments a
      JOIN clients c ON c.id = a.client_id
      JOIN employees e ON e.id = a.employee_id
      WHERE a.start_at >= ? AND a.start_at < ?
      ORDER BY a.start_at ASC
    `).all(...params);
  }
  res.json({ appointments: rows });
});

r.post("/", (req, res) => {
  const schema = z.object({
    employee_id: z.number().int(),
    client_id: z.number().int(),
    start_at: z.string().min(1),
    end_at: z.string().min(1),
    service_name: z.string().min(1),
    notes: z.string().optional(),
  });
  const data = schema.parse(req.body);

  if (overlaps(data.employee_id, data.start_at, data.end_at)) {
    return res.status(409).json({ error: "Ten termin jest już zajęty dla tego pracownika" });
  }

  const info = db.prepare(`
    INSERT INTO appointments (employee_id, client_id, start_at, end_at, service_name, notes, created_by_user_id)
    VALUES (?,?,?,?,?,?,?)
  `).run(data.employee_id, data.client_id, data.start_at, data.end_at, data.service_name, data.notes || null, req.user.id);

  const io = req.app.get("io");
  io.emit("appointmentsUpdated", { kind: "create", id: info.lastInsertRowid });

  res.json({ id: info.lastInsertRowid });
});

r.patch("/:id", (req, res) => {
  const schema = z.object({
    employee_id: z.number().int().optional(),
    client_id: z.number().int().optional(),
    start_at: z.string().optional(),
    end_at: z.string().optional(),
    service_name: z.string().optional(),
    notes: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const id = Number(req.params.id);

  const current = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id);
  if (!current) return res.status(404).json({ error: "Nie znaleziono wizyty" });

  const employee_id = data.employee_id ?? current.employee_id;
  const start_at = data.start_at ?? current.start_at;
  const end_at = data.end_at ?? current.end_at;

  if (overlaps(employee_id, start_at, end_at, id)) {
    return res.status(409).json({ error: "Ten termin jest już zajęty dla tego pracownika" });
  }

  db.prepare(`
    UPDATE appointments
    SET employee_id=?, client_id=?, start_at=?, end_at=?, service_name=?, notes=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    employee_id,
    data.client_id ?? current.client_id,
    start_at,
    end_at,
    data.service_name ?? current.service_name,
    data.notes ?? current.notes,
    id
  );

  const io = req.app.get("io");
  io.emit("appointmentsUpdated", { kind: "update", id });

  res.json({ ok: true });
});

r.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  db.prepare("DELETE FROM appointments WHERE id = ?").run(id);

  const io = req.app.get("io");
  io.emit("appointmentsUpdated", { kind: "delete", id });

  res.json({ ok: true });
});

export default r;
