import { pool } from '../db.js';

/* ---------------- helpers ---------------- */

function validateId(id, name = 'id') {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`invalid ${name}`);
  }
  return n;
}

function validatePrice(price) {
  const n = Number(price);
  if (Number.isNaN(n) || n < 0) {
    throw new Error('invalid price');
  }
  return n;
}

function validateDuration(minutes) {
  const n = Number(minutes);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error('invalid duration');
  }
  return n;
}

/* ---------------- CRUD ---------------- */
/**
 * Get all configurations
 */

export async function findAll(){
    const { rows } = await pool.query(
        `SELECT id, breed_id, service_id, weight_class_id, price, duration_minutes, buffer_minutes, is_active, created_at, updated_at FROM service_configurations`
    )
    return rows ?? null;
}
/**
 * Get configuration by composite key
 */
export async function findOne(breedId, serviceId, weightClassId) {
  const sid = validateId(breedId, 'breed_id');
  const srv = validateId(serviceId, 'service_id');
  const wid = validateId(weightClassId, 'weight_class_id');

  const { rows } = await pool.query(
    `
    SELECT breed_id, service_id, weight_class_id,
           price, duration_minutes, buffer_minutes, is_active
    FROM service_configurations
    WHERE breed_id = $1
      AND service_id = $2
      AND weight_class_id = $3
    `,
    [sid, srv, wid]
  );

  return rows[0] ?? null;
}

/**
 * Create configuration
 */
export async function create({
  breed_id,
  service_id,
  weight_class_id,
  price,
  duration_minutes,
  buffer_minutes,
  is_active = true,
}) {
  const sid = validateId(breed_id, 'breed_id');
  const srv = validateId(service_id, 'service_id');
  const wid = validateId(weight_class_id, 'weight_class_id');
  const p = validatePrice(price);
  const d = validateDuration(duration_minutes);
  const b = validateBuffer(buffer_minutes);

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO service_configurations
        (breed_id, service_id, weight_class_id, price, duration_minutes, buffer_minutes, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING breed_id, service_id, weight_class_id,
                price, duration_minutes, is_active
      `,
      [sid, srv, wid, p, d, b, is_active]
    );

    return rows[0];

  } catch (err) {
    if (err.code === '23505') {
      throw new Error('configuration already exists');
    }
    if (err.code === '23503') {
      throw new Error('invalid breed, service, or weight class');
    }
    throw err;
  }
}

/**
 * Update configuration (partial update allowed)
 */
export async function update(
  breedId,
  serviceId,
  weightClassId,
  updates
) {
  const sid = validateId(breedId, 'breed_id');
  const srv = validateId(serviceId, 'service_id');
  const wid = validateId(weightClassId, 'weight_class_id');

  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('no fields provided for update');
  }

  const fields = [];
  const values = [];
  let index = 1;

  if ('price' in updates) {
    fields.push(`price = $${index++}`);
    values.push(validatePrice(updates.price));
  }

  if ('duration_minutes' in updates) {
    fields.push(`duration_minutes = $${index++}`);
    values.push(validateDuration(updates.duration_minutes));
  }

    if ('buffer_minutes' in updates) {
    fields.push(`buffer_minutes = $${index++}`);
    values.push(validateDuration(updates.buffer_minutes));
  }

  if ('is_active' in updates) {
    fields.push(`is_active = $${index++}`);
    values.push(Boolean(updates.is_active));
  }

  if (fields.length === 0) {
    throw new Error('no valid fields provided');
  }

  values.push(sid, srv, wid);

  const { rows } = await pool.query(
    `
    UPDATE service_configurations
    SET ${fields.join(', ')}
    WHERE breed_id = $${index}
      AND service_id = $${index + 1}
      AND weight_class_id = $${index + 2}
    RETURNING breed_id, service_id, weight_class_id,
              price, duration_minutes, is_active
    `,
    values
  );

  if (!rows[0]) {
    throw new Error('configuration not found');
  }

  return rows[0];
}

/**
 * Delete configuration
 */
export async function remove(breedId, serviceId, weightClassId) {
  const sid = validateId(breedId, 'breed_id');
  const srv = validateId(serviceId, 'service_id');
  const wid = validateId(weightClassId, 'weight_class_id');

  const { rowCount } = await pool.query(
    `
    DELETE FROM service_configurations
    WHERE breed_id = $1
      AND service_id = $2
      AND weight_class_id = $3
    `,
    [sid, srv, wid]
  );

  if (rowCount === 0) {
    throw new Error('configuration not found');
  }

  return true;
}

/* ---------------- useful helpers ---------------- */

/**
 * Get price/duration for a pet (most common lookup)
 */
export async function getActiveConfig(breedId, serviceId, weightClassId) {
  const config = await findOne(breedId, serviceId, weightClassId);
  if (!config || !config.is_active) return null;
  return config;
}

/**
 * List all configs for a service (admin)
 */
export async function findByService(serviceId) {
  const srv = validateId(serviceId, 'service_id');

  const { rows } = await pool.query(
    `
    SELECT breed_id, service_id, weight_class_id,
           price, duration_minutes, is_active
    FROM service_configurations
    WHERE service_id = $1
    ORDER BY breed_id, weight_class_id
    `,
    [srv]
  );

  return rows;
}