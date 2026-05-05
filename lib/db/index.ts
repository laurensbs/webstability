import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// HTTP driver: works on both Edge and Node, no WebSocket needed.
const client = neon(process.env.DATABASE_URL);

export const db = drizzle(client, { schema, casing: "snake_case" });
export * as s from "./schema";
