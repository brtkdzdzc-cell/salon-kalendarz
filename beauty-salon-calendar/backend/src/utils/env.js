import process from "process";

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === null || v === "") throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  PORT: Number(process.env.PORT || 4000),
  DB_PATH: required("DB_PATH", "./data/app.db"),
  JWT_SECRET: required("JWT_SECRET", "change_me"),
  CORS_ORIGIN: required("CORS_ORIGIN", "http://localhost:5173"),
};
