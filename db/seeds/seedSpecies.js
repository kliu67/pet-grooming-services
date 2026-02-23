import fs from "fs/promises";
import path from "path";
import pkg from "pg";
import 'dotenv/config';

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT)
});

async function seedSpecies() {
  try {
    const filePath = path.resolve("db/seeds/species.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const dogsList = JSON.parse(raw).dogs;

    console.log(`Seeding ${dogsList.length} dogs...`);

    for (const s of dogsList) {
      await pool.query(
        `
        INSERT INTO species (name)
        VALUES ($1)
        ON CONFLICT (name) DO NOTHING
        `,
        [s]
      );
    }

    console.log("✅ Species seeded successfully");
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    await pool.end();
  }
}

seedSpecies();