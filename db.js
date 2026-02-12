import pg from "pg";
import dotenv from "dotenv";

if (process.env.NODE_ENV === "test") {
  dotenv.config({ path: ".env.test" });
} else {
  dotenv.config();
}
const { Pool } = pg;

// export const pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
// });

export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  ssl: {
    rejectUnauthorized: false, // required for RDS
  },
});



export async function initDb() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
        );
    `);

    await pool.query(`

    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(60) NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP,
        UNIQUE(full_name, email, phone)
        );
    `);


    await pool.query(`
    CREATE TABLE IF NOT EXISTS species (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(60) NOT NULL
        );
    `);


    await pool.query(`
    CREATE TABLE IF NOT EXISTS pets(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(20) NOT NULL,
        species UUID REFERENCES species(id),
        owner UUID REFERENCES users(id),
        created_at TIMESTAMP
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS services(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(60) NOT NULL,
        price REAL NOT NULL,
        created_at TIMESTAMP
        )`)
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS appointments(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        pet_id UUID REFERENCES pets(id),
        service_id UUID REFERENCES services(id),
        description TEXT,
        created_at TIMESTAMP
        )`);

    const result = await pool.query("SELECT 1");
    console.log("DB OK:", result.rows);
}
