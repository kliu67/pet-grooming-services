import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      executed_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

async function getExecutedMigrations() {
  const { rows } = await pool.query(
    `SELECT version FROM schema_migrations`
  );
  return new Set(rows.map(r => r.version));
}

async function runMigration(file) {
  const sql = fs.readFileSync(
    path.join(MIGRATIONS_DIR, file),
    "utf-8"
  );

  console.log(`Running migration: ${file}`);
  await pool.query(sql);

  await pool.query(
    `INSERT INTO schema_migrations (version) VALUES ($1)`,
    [file]
  );
}

async function migrate() {
  await ensureMigrationsTable();

  const executed = await getExecutedMigrations();
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (!executed.has(file)) {
      await runMigration(file);
    }
  }

  console.log("Migrations complete.");
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
