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

// export const pool = new Pool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: Number(process.env.DB_PORT),
//   ssl: {
//     rejectUnauthorized: false // required for RDS
//   }
// });

//use this for public connections
export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT)
  // ssl: {
  //   rejectUnauthorized: false // required for RDS
  // }
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
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(60) NOT NULL UNIQUE,
        email TEXT UNIQUE,
        phone TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(full_name, email, phone)
        );
    `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS species (
        id SERIAL PRIMARY KEY,
        name VARCHAR(60) NOT NULL
        );
    `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pets(
        id SERIAL PRIMARY KEY,
        name VARCHAR(20) NOT NULL,
        species INTEGER NOT NULL REFERENCES species(id),
        owner INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        uuid UUID DEFAULT gen_random_uuid(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

  await pool.query(`
        CREATE TABLE IF NOT EXISTS services(
        id SERIAL PRIMARY KEY,
        name VARCHAR(60) NOT NULL UNIQUE,
        base_price NUMERIC(10,2) NOT NULL,
        uuid UUID DEFAULT gen_random_uuid(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        `);

  await pool.query(`
        CREATE TABLE IF NOT EXISTS appointments(
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        pet_id INTEGER REFERENCES pets(id) NOT NULL,
        service_id INTEGER REFERENCES services(id) NOT NULL,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );`);

  await pool.query(`
        CREATE TABLE IF NOT EXISTS weight_classes (
        id SERIAL PRIMARY KEY,
        label TEXT NOT NULL UNIQUE
        );
      `);

  await pool.query(`
        CREATE TABLE IF NOT EXISTS service_configurations (
        species_id INTEGER REFERENCES species(id) ON DELETE CASCADE,
        service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
        weight_class_id INTEGER REFERENCES weight_classes(id) ON DELETE CASCADE,
        
        price NUMERIC(10, 2) NOT NULL,
        duration_minutes INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        
        PRIMARY KEY (species_id, service_id, weight_class_id));
      `);

  const result = await pool.query("SELECT 1");
  console.log("DB OK:", result.rows);
}
