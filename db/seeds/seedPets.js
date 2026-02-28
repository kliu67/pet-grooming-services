
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
        const filePath = path.resolve("db/seeds/pets.json");
        const raw = await fs.readFile(filePath, "utf-8");
        const petsList = JSON.parse(raw).Pets;
    
        console.log(`Seeding ${petsList.length} pets...`);
    
        for (const p of petsList) {
          await pool.query(
            `
            INSERT INTO pets (name, species, owner)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
            `,
            [p.name, p.species, p.owner]
          );
        }
    
        console.log("✅ Pets seeded successfully");
      } catch (err) {
        console.error("❌ Seed failed:", err);
      } finally {
        await pool.end();
      }
    }
    
    seedSpecies();