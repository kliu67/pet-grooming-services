CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT NOW()
);

 CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

 CREATE TABLE IF NOT EXISTS species (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL
      CHECK (length(trim(name)) > 0),
    created_at TIMESTAMP DEFAULT NOW()
  );

   CREATE UNIQUE INDEX IF NOT EXISTS species_name_lower_unique
    ON species (LOWER(name));

   CREATE TABLE IF NOT EXISTS pets(
        id SERIAL PRIMARY KEY,
        name VARCHAR(60) NOT NULL
          CHECK (length(trim(name)) > 0),
        species INTEGER NOT NULL REFERENCES species(id),
        owner INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP
        );
    
    CREATE INDEX IF NOT EXISTS idx_pets_owner   ON pets(owner);
    CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species);

      CREATE TABLE IF NOT EXISTS services(
        id SERIAL PRIMARY KEY,
        name VARCHAR(60) NOT NULL UNIQUE,
        base_price NUMERIC(10,2) NOT NULL,
        uuid UUID DEFAULT gen_random_uuid(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

   CREATE TABLE IF NOT EXISTS appointments(
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
        pet_id INTEGER REFERENCES pets(id) ON DELETE RESTRICT NOT NULL,
        service_id INTEGER REFERENCES services(id) ON DELETE RESTRICT NOT NULL,
        description TEXT,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        CHECK (end_time > start_time),
        status TEXT NOT NULL DEFAULT 'booked'
        CHECK (status IN ('booked','confirmed','completed','cancelled','no_show')),
        price_snapshot NUMERIC(10,2) NOT NULL
          CHECK (price_snapshot >= 0),
        duration_snapshot INTEGER NOT NULL
          CHECK (duration_snapshot > 0),
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_appt_user   ON appointments(user_id);
        CREATE INDEX IF NOT EXISTS idx_appt_pet    ON appointments(pet_id);
        CREATE INDEX IF NOT EXISTS idx_appt_start  ON appointments(start_time);
        CREATE INDEX IF NOT EXISTS idx_appt_pet_start  ON appointments(pet_id, start_time);
        CREATE INDEX IF NOT EXISTS idx_appt_status ON  appointments(status);
        
        CREATE EXTENSION IF NOT EXISTS btree_gist;

        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

          CREATE TABLE IF NOT EXISTS weight_classes (
        id SERIAL PRIMARY KEY,
        label TEXT NOT NULL
        CHECK (length(trim(label)) > 0)
        );

        CREATE UNIQUE INDEX IF NOT EXISTS weight_classes_label_lower_unique
        ON weight_classes (LOWER(label));
        

           CREATE TABLE IF NOT EXISTS service_configurations (
        species_id INTEGER NOT NULL REFERENCES species(id) ON DELETE CASCADE,
        service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        weight_class_id INTEGER NOT NULL REFERENCES weight_classes(id) ON DELETE CASCADE,
        
        price NUMERIC(10, 2) NOT NULL
          CHECK (price >= 0) ,
        duration_minutes INTEGER NOT NULL
          CHECK (duration_minutes > 0),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP,
        PRIMARY KEY (species_id, service_id, weight_class_id));

        CREATE INDEX IF NOT EXISTS idx_cfg_species_service 
        ON service_configurations (species_id, service_id);

        CREATE INDEX IF NOT EXISTS idx_cfg_service
        ON service_configurations (service_id);