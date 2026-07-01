import fs from "fs/promises";
import path from "path";
import pkg from "pg";
import "dotenv/config";

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT)
});

async function seedNoServiceBreeds() {
  try {
    const filePath = path.resolve("db/seeds/noServiceBreeds.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const breedList = JSON.parse(raw).breeds;

    console.log(`Seeding ${breedList.length} no service breeds...`);

    for (const breedName of breedList) {
      await pool.query(
        `INSERT INTO no_service_breeds (name)
         VALUES ($1)
         ON CONFLICT DO NOTHING`,
        [breedName]
      );
    }

    console.log("No service breeds seeded successfully");
  } catch (err) {
    console.error("Seed failed:", err);
  } finally {
    await pool.end();
  }
}

seedNoServiceBreeds();
