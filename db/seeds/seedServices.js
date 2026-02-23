
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
        const filePath = path.resolve("db/seeds/services.json");
        const raw = await fs.readFile(filePath, "utf-8");
        const servicesList = JSON.parse(raw).services;
    
        console.log(`Seeding ${servicesList.length} services...`);
    
        for (const s of servicesList) {
          await pool.query(
            `
            INSERT INTO services (name, base_price, description)
            VALUES ($1, $2, $3)
            ON CONFLICT (name) DO NOTHING
            `,
            [s.name, s.base_price, s.description]
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