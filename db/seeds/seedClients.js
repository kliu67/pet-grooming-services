
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
        const filePath = path.resolve("db/seeds/clients.json");
        const raw = await fs.readFile(filePath, "utf-8");
        const clientsList = JSON.parse(raw).clients;
    
        console.log(`Seeding ${clientsList.length} clients...`);
    
        for (const c of clientsList) {
          await pool.query(
            `
            INSERT INTO users (first_name, last_name, phone, email, description)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING
            `,
            [c.first_name, c.last_name, c.phone, c.email, c.description]
          );
        }
    
        console.log("✅ Clients seeded successfully");
      } catch (err) {
        console.error("❌ Seed failed:", err);
      } finally {
        await pool.end();
      }
    }
    
    seedSpecies();