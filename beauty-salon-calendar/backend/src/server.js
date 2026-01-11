import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import { env } from "./utils/env.js";
import { db } from "./db/db.js";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import employeesRoutes from "./routes/employees.js";
import clientsRoutes from "./routes/clients.js";
import appointmentsRoutes from "./routes/appointments.js";

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
});

app.set("io", io);

// Basic hardening
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// Health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/appointments", appointmentsRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Server error" });
});

io.on("connection", (socket) => {
  socket.emit("hello", { ok: true });
});

server.listen(env.PORT, async () => {
  console.log(`API listening on http://localhost:${env.PORT}`);

  // ping db (Postgres)
  try {
    await db.prepare("SELECT 1").get();
    console.log("✅ DB ping ok");
  } catch (e) {
    console.error("❌ DB ping failed", e);
  }
});
