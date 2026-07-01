
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

async function seedStylists() {
    try {
        const filePath = path.resolve("db/seeds/stylists.json");
        const raw = await fs.readFile(filePath, "utf-8");
        const stylistsList = JSON.parse(raw).stylists;
    
        console.log(`Seeding ${stylistsList.length} clients...`);
    
        for (const c of stylistsList) {
          await pool.query(
            `
            INSERT INTO stylists (first_name, last_name, email, phone, is_active)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING
            `,
            [c.first_name, c.last_name, c.email, c.phone, c.is_active]
          );
        }
    
        console.log("✅ Stylists seeded successfully");
      } catch (err) {
        console.error("❌ Seed failed:", err);
      } finally {
        await pool.end();
      }
    }
    
    seedStylists();