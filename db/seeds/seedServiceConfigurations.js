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

function setPrice(code, weight='') {
  switch (code) {
    case "BATH_BRUSH":
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
    case "BASIC_GROOMING":
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
    case "FULL_GROOMING":
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
    case "CAT_BATH":
      return 60;
    case "CAT_BATH_LONG":
      return 65;
    case "CAT_HAIR_TRIMMING":
      return 100;
    default:
      return 10;
  }
}

function setDuration(code, weight='') {
  switch (code) {
    case "BATH_BRUSH":
    case "BASIC_GROOMING":
      if (weight === "small") {
        return DURATIONS.ONE_HOUR;
      }
      return DURATIONS.HOUR_AND_HALF;
    case "FULL_GROOMING":
      if (weight === "small") {
        return DURATIONS.TWO_HOURS;
      }
      return DURATIONS.THREE_HOURS;
    case "CAT_BATH":
    case "CAT_BATH_LONG":
    case "CAT_HAIR_TRIMMING":
      return DURATIONS.TWO_HOURS;
    default:
      return DURATIONS.TEN_MINUTES;
  }
}

function setBuffer(code){
  switch(code){
    case "BATH_BRUSH":
    case "BASIC_GROOMING":
    case "FULL_GROOMING":
    case "CAT_HAIR_TRIMMING":
    case "CAT_BATH":
    case "CAT_BATH_LONG":
        return DURATIONS.TEN_MINUTES;
    default:
      return 0;
  }
}

async function seedServiceConfigurations() {
  const configList = [];

  try {
    const { rows: serviceList } = await pool.query(
      'SELECT id, name, base_price, species, code FROM services'
    );

    console.log(serviceList);

    const dogServiceList = serviceList.filter((service)=>service.species === 'DOG');
    const catServiceList =  serviceList.filter((service)=>service.species === 'CAT');

    const { rows: weightClassList } = await pool.query(
      "SELECT id, label FROM weight_classes"
    );

    console.log('dogs: ' + dogServiceList);
    console.log('cats: ' + catServiceList)

      for (const service of dogServiceList) {
        for (const wc of weightClassList) {
          configList.push({
            service_id: service.id,
            weight_class_id: wc.id,
            price: setPrice(service.code, wc.label),
            duration_minutes: setDuration(service.code, wc.label),
            buffer_minutes: setBuffer(service.code),
            is_active: true
          });
        }
      }
       for (const service of catServiceList) {
          configList.push({
            service_id: service.id,
            weight_class_id: 1,
            price: setPrice(service.code),
            duration_minutes: setDuration(service.code),
            buffer_minutes: setBuffer(service.code),
            is_active: true
          });
      }

    for (const c of configList) {
      await pool.query(
        `INSERT INTO service_configurations (service_id, weight_class_id, price, duration_minutes, is_active, buffer_minutes)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [
          c.service_id,
          c.weight_class_id,
          c.price,
          c.duration_minutes,
          c.is_active,
          c.buffer_minutes
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
