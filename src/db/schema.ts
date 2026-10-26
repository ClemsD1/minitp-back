import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const schemaPath = fileURLToPath(new URL("../../database/schema.sql", import.meta.url));

export async function initializeDatabase(): Promise<void> {
  const schema = await readFile(schemaPath, "utf8");
  await pool.query(schema);
}
