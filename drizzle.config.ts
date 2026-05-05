import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next reads .env.local at runtime; drizzle-kit doesn't, so we load it manually.
loadEnv({ path: [".env.local", ".env"] });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  casing: "snake_case",
});
