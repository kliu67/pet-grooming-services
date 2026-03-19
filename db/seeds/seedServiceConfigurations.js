import pkg from "pg";
import "dotenv/config";

const DURATIONS = {
  TEN_MINUTES: 10,
  ONE_HOUR: 60,
  HOUR_AND_HALF: 90,
  TWO_HOURS: 120,
  THREE_HOURS: 180
};

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT)
});

function setPrice(service, weight) {
  switch (service) {
    case "Bath":
      switch (weight) {
        case "extra large":
          return 70;
        case "large":
          return 50;
        case "medium":
          return 40;
        default:
          return 30;
      }
    case "Basic grooming":
      switch (weight) {
        case "extra large":
          return 85;
        case "large":
          return 65;
        case "medium":
          return 50;
        default:
          return 40;
      }
    case "Full grooming":
      switch (weight) {
        case "extra large":
          return 100;
        case "large":
          return 85;
        case "medium":
          return 75;
        default:
          return 60;
      }
    default:
      return 10;
  }
}

function setDuration(service, weight) {
  switch (service) {
    case "Bath":
    case "Basic grooming":
      if (weight === "small") {
        return DURATIONS.ONE_HOUR;
      }
      return DURATIONS.HOUR_AND_HALF;
    case "Full grooming":
      if (weight === "small") {
        return DURATIONS.TWO_HOURS;
      }
      return DURATIONS.THREE_HOURS;
    default:
      return DURATIONS.TEN_MINUTES;
  }
}

function setIsActive(breed, noServiceList) {
  return !noServiceList.includes(breed);
}

async function seedServiceConfigurations() {
  const configList = [];

  try {
    const { rows: breedList } = await pool.query("SELECT id, name FROM breeds");
    const { rows: serviceList } = await pool.query(
      "SELECT id, name, base_price FROM services"
    );
    const { rows: noServiceRows } = await pool.query(
      "SELECT name FROM no_service_breeds"
    );
    const { rows: weightClassList } = await pool.query(
      "SELECT id, label FROM weight_classes"
    );

    const noServiceList = noServiceRows.map((breed) => breed.name);

    for (const breed of breedList) {
      for (const service of serviceList) {
        for (const wc of weightClassList) {
          configList.push({
            breed_id: breed.id,
            service_id: service.id,
            weight_class_id: wc.id,
            price: setPrice(service.name, wc.label),
            duration_minutes: setDuration(service.name, wc.label),
            is_active: setIsActive(breed.name, noServiceList)
          });
        }
      }
    }

    for (const c of configList) {
      await pool.query(
        `INSERT INTO service_configurations (breed_id, service_id, weight_class_id, price, duration_minutes, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [
          c.breed_id,
          c.service_id,
          c.weight_class_id,
          c.price,
          c.duration_minutes,
          c.is_active
        ]
      );
    }

    console.log("Service configurations seeded successfully");
  } catch (err) {
    console.error("Seed failed:", err);
  } finally {
    await pool.end();
  }
}

seedServiceConfigurations();
