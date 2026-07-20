import { ensureSchema } from "../api/_lib/db.js";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Pull Vercel environment variables first.");
  process.exit(1);
}

await ensureSchema();
console.log("GuideGPT database schema is ready.");
