import pg from "pg";
import dotenv from "dotenv";

if (process.env.NODE_ENV === "test") {
  dotenv.config({ path: ".env.test" });
} else {
  dotenv.config();
}
const { Pool } = pg;

function getSslConfig() {
  const sslMode = process.env.DB_SSL_MODE;
  const sslEnabled = process.env.DB_SSL === "true" || sslMode === "require";

  if (!sslEnabled) {
    return undefined;
  }

  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true",
  };
}

function getPoolConfig() {
  const ssl = getSslConfig();
  const databaseUrl = process.env.DATABASE_URL;
  const hasConnectionString =
    typeof databaseUrl === "string" &&
    /^(postgres|postgresql):\/\//.test(databaseUrl);

  if (hasConnectionString) {
    return {
      connectionString: databaseUrl,
      ...(ssl ? { ssl } : {}),
    };
  }

  return {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ...(ssl ? { ssl } : {}),
  };
}

export const pool = new Pool(getPoolConfig());

export async function initDb() {


  // await pool.query(`
  //   CREATE TABLE IF NOT EXISTS clients (
  //   id SERIAL PRIMARY KEY,
  //   first_name VARCHAR(60) NOT NULL,
  //   last_name VARCHAR(60) NOT NULL,
  //   email TEXT UNIQUE,
  //   phone TEXT UNIQUE NOT NULL,
  //   description TEXT,
  //   created_at TIMESTAMP NOT NULL DEFAULT NOW()
  //       );
  //   `);

  // await pool.query(`
  //   CREATE TABLE IF NOT EXISTS breed (
  //   id SERIAL PRIMARY KEY,
  //   name VARCHAR(60) NOT NULL
  //     CHECK (length(trim(name)) > 0),
  //   created_at TIMESTAMP DEFAULT NOW()
  // );

  //   CREATE UNIQUE INDEX IF NOT EXISTS breeds_name_lower_unique
  //   ON breeds (LOWER(name));
  //   `);

  // await pool.query(`
  //   CREATE TABLE IF NOT EXISTS pets(
  //       id SERIAL PRIMARY KEY,
  //       name VARCHAR(60) NOT NULL
  //         CHECK (length(trim(name)) > 0),
  //       breeds INTEGER NOT NULL REFERENCES breeds(id),
  //       owner INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  //       uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  //       created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  //       updated_at TIMESTAMP
  //       );
    
  //   CREATE INDEX IF NOT EXISTS idx_pets_owner   ON pets(owner);
  //   CREATE INDEX IF NOT EXISTS idx_pets_breeds ON pets(breeds);
  //   `);

  // await pool.query(`
  //       CREATE TABLE IF NOT EXISTS services(
  //       id SERIAL PRIMARY KEY,
  //       name VARCHAR(60) NOT NULL UNIQUE,
  //       base_price NUMERIC(10,2) NOT NULL,
  //       uuid UUID DEFAULT gen_random_uuid(),
  //       created_at TIMESTAMP NOT NULL DEFAULT NOW()
  //       );
  //       `);

  // await pool.query(`
  //       CREATE TABLE IF NOT EXISTS appointments(
  //       id SERIAL PRIMARY KEY,
  //       client_id INTEGER REFERENCES clients(id) ON DELETE RESTRICT NOT NULL,
  //       pet_id INTEGER REFERENCES pets(id) ON DELETE RESTRICT NOT NULL,
  //       service_id INTEGER REFERENCES services(id) ON DELETE RESTRICT NOT NULL,
  //       description TEXT,
  //       start_time TIMESTAMPTZ NOT NULL,
  //       end_time TIMESTAMPTZ NOT NULL,
  //       CHECK (end_time > start_time),
  //       status TEXT NOT NULL DEFAULT 'booked'
  //       CHECK (status IN ('booked','confirmed','completed','cancelled','no_show')),
  //       price_snapshot NUMERIC(10,2) NOT NULL
  //         CHECK (price_snapshot >= 0),
  //       duration_snapshot INTEGER NOT NULL
  //         CHECK (duration_snapshot > 0),
  //       uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  //       created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  //       updated_at TIMESTAMP
  //       );
        
  //       CREATE INDEX IF NOT EXISTS idx_appt_client   ON appointments(client_id);
  //       CREATE INDEX IF NOT EXISTS idx_appt_pet    ON appointments(pet_id);
  //       CREATE INDEX IF NOT EXISTS idx_appt_start  ON appointments(start_time);
  //       CREATE INDEX IF NOT EXISTS idx_appt_pet_start  ON appointments(pet_id, start_time);
  //       CREATE INDEX IF NOT EXISTS idx_appt_status ON  appointments(status);
        
  //       CREATE EXTENSION IF NOT EXISTS btree_gist;

  //       ALTER TABLE appointments
  //       ADD CONSTRAINT no_overlapping_pet_appointments
  //       EXCLUDE USING gist (
  //         pet_id WITH =,
  //         tstzrange(start_time, end_time) WITH &&
  //       );

  //       CREATE OR REPLACE FUNCTION set_updated_at()
  //       RETURNS TRIGGER AS $$
  //       BEGIN
  //       NEW.updated_at = NOW();
  //       RETURN NEW;
  //       END;
  //       $$ LANGUAGE plpgsql;

  //       CREATE TRIGGER appointments_set_updated_at
  //       BEFORE UPDATE ON appointments
  //       FOR EACH ROW
  //       EXECUTE FUNCTION set_updated_at();
        
  //       `);

  // await pool.query(`
  //      CREATE TABLE IF NOT EXISTS weight_classes (
  //       id SERIAL PRIMARY KEY,
  //       label TEXT NOT NULL
  //       CHECK (length(trim(label)) > 0)
  //       );

  //       CREATE UNIQUE INDEX IF NOT EXISTS weight_classes_label_lower_unique
  //       ON weight_classes (LOWER(label));
  //     `);

  // await pool.query(`
  //       CREATE TABLE IF NOT EXISTS service_configurations (
  //       breeds_id INTEGER NOT NULL REFERENCES breeds(id) ON DELETE CASCADE,
  //       service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  //       weight_class_id INTEGER NOT NULL REFERENCES weight_classes(id) ON DELETE CASCADE,
        
  //       price NUMERIC(10, 2) NOT NULL
  //         CHECK (price >= 0) ,
  //       duration_minutes INTEGER NOT NULL
  //         CHECK (duration_minutes > 0),
  //       is_active BOOLEAN DEFAULT TRUE,
  //       created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  //       updated_at TIMESTAMP,
  //       PRIMARY KEY (breeds_id, service_id, weight_class_id));

  //       CREATE INDEX IF NOT EXISTS idx_cfg_breeds_service 
  //       ON service_configurations (breeds_id, service_id);

  //       CREATE INDEX IF NOT EXISTS idx_cfg_service
  //       ON service_configurations (service_id);
  //     `);

  const result = await pool.query("SELECT 1");
  console.log("DB OK:", result.rows);
}
