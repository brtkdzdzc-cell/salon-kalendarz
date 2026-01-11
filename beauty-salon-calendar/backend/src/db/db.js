import pg from "pg";
import { env } from "../utils/env.js";

const { Pool } = pg;

if (!env.DATABASE_URL) {
  throw new Error("Brak env.DATABASE_URL — w Render ustaw DATABASE_URL z Supabase");
}

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// zamiana ? -> $1, $2...
function qmarkToDollar(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

/**
 * Kompatybilne API pod Twoje dotychczasowe route’y:
 * db.prepare(sql).all/get/run
 * (ale asynchroniczne → trzeba używać await)
 */
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
      }
    };
  }
};
