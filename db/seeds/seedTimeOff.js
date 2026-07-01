
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

async function seedTimeOff() {
    try {
        const filePath = path.resolve("db/seeds/timeOff.json");
        const raw = await fs.readFile(filePath, "utf-8");
        const timeOffList = JSON.parse(raw).timeOff;
    
        console.log(`Seeding ${timeOffList.length} time offs...`);
    
        for (const t of timeOffList) {
          await pool.query(
            `
            INSERT INTO stylist_time_off (stylist_id, start_datetime, end_datetime, reason)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
            `,
            [t.stylist_id, t.start_datetime, t.end_datetime, t.reason]
          );
        }
    
        console.log("✅ stylist time offs seeded successfully");
      } catch (err) {
        console.error("❌ Seed failed:", err);
      } finally {
        await pool.end();
      }
    }
    
    seedTimeOff();