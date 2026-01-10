import Database from "better-sqlite3";
import { env } from "../utils/env.js";
import fs from "fs";
import path from "path";

const dbDir = path.dirname(env.DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

export const db = new Database(env.DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
