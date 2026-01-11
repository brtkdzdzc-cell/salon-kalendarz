import { z } from "zod";

const schema = z.object({
  // Render/Node
  PORT: z.coerce.number().default(4000),

  // Auth
  JWT_SECRET: z.string().min(1),

  // Frontend origin (np. https://twoj-frontend.onrender.com albo https://salontarnobrzeg.pl)
  CORS_ORIGIN: z.string().min(1),

  // Supabase Postgres
  DATABASE_URL: z.string().min(1),
});

export const env = schema.parse(process.env);
