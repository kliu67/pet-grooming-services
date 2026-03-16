
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

async function seedAppointments() {
    try {
        const filePath = path.resolve("db/seeds/availability.json");
        const raw = await fs.readFile(filePath, "utf-8");
        const availabilityList = JSON.parse(raw).availability;
    
        console.log(`Seeding ${availabilityList.length} availability...`);
    
        for (const a of availabilityList) {
          await pool.query(
            `
            INSERT INTO stylist_availability (stylist_id, day_of_week, start_time, end_time)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
            `,
            [a.stylist_id, a.day_of_week, a.start_time, a.end_time]
          );
        }
    
        console.log("✅ Stylist availability seeded successfully");
      } catch (err) {
        console.error("❌ Seed failed:", err);
      } finally {
        await pool.end();
      }
    }
    
    seedAppointments();