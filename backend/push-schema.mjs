// push-schema.mjs — run with: node --dns-result-order=ipv4first push-schema.mjs
import { readFileSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { Client } = require("pg");

const sql = readFileSync(join(__dirname, "supabase/schema.sql"), "utf8");

const client = new Client({
  connectionString:
    "postgresql://postgres:Algo_Pivot123456@db.fufndhqooqthptijzpmv.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

console.log("Connecting to Supabase...");
await client.connect();
console.log("Connected. Running schema...");

// Split on statement-ending semicolons so we can report per-statement errors
const statements = sql
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter(Boolean);

let ok = 0;
let skipped = 0;
for (const stmt of statements) {
  try {
    await client.query(stmt);
    ok++;
  } catch (e) {
    if (
      e.message.includes("already exists") ||
      e.message.includes("duplicate") ||
      e.code === "42710" || // duplicate_object
      e.code === "42P07"    // duplicate_table
    ) {
      skipped++;
    } else {
      console.error("ERROR on statement:\n", stmt.slice(0, 120));
      console.error("  →", e.message);
    }
  }
}

await client.end();
console.log(`\nDone. ${ok} statements applied, ${skipped} already existed.`);
