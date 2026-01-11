import pg from "pg";
import dns from "dns";
import { env } from "../utils/env.js";

const { Pool } = pg;

// Wymuś IPv4 (rozwiązuje ENETUNREACH na Render przy próbie łączenia po IPv6)
dns.setDefaultResultOrder("ipv4first");

if (!env.DATABASE_URL) {
  throw new Error("Brak env.DATABASE_URL — w Render ustaw DATABASE_URL z Supabase");
}

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// zamiana ? -> $1, $2...
function qmarkToDollar(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export const db = {
  prepare(sql) {
    const text = qmarkToDollar(sql);

    return {
      async all(...params) {
        const r = await pool.query(text, params);
        return r.rows;
      },
      async get(...params) {
        const r = await pool.query(text, params);
        return r.rows[0] ?? null;
      },
      async run(...params) {
        const r = await pool.query(text, params);
        const id = r.rows?.[0]?.id ?? null;
        return { lastInsertRowid: id, changes: r.rowCount };
      },
    };
  },
};
