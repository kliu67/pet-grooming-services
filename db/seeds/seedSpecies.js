import fs from "fs/promises";
import path from "path";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
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
        [s.name]
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