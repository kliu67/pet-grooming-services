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
 * Get configuration by composite key
 */
export async function findOne(speciesId, serviceId, weightClassId) {
  const sid = validateId(speciesId, 'species_id');
  const srv = validateId(serviceId, 'service_id');
  const wid = validateId(weightClassId, 'weight_class_id');

  const { rows } = await pool.query(
    `
    SELECT species_id, service_id, weight_class_id,
           price, duration_minutes, is_active
    FROM service_configurations
    WHERE species_id = $1
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
  species_id,
  service_id,
  weight_class_id,
  price,
  duration_minutes,
  is_active = true,
}) {
  const sid = validateId(species_id, 'species_id');
  const srv = validateId(service_id, 'service_id');
  const wid = validateId(weight_class_id, 'weight_class_id');
  const p = validatePrice(price);
  const d = validateDuration(duration_minutes);

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO service_configurations
        (species_id, service_id, weight_class_id, price, duration_minutes, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING species_id, service_id, weight_class_id,
                price, duration_minutes, is_active
      `,
      [sid, srv, wid, p, d, is_active]
    );

    return rows[0];

  } catch (err) {
    if (err.code === '23505') {
      throw new Error('configuration already exists');
    }
    if (err.code === '23503') {
      throw new Error('invalid species, service, or weight class');
    }
    throw err;
  }
}

/**
 * Update configuration (partial update allowed)
 */
export async function update(
  speciesId,
  serviceId,
  weightClassId,
  updates
) {
  const sid = validateId(speciesId, 'species_id');
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
    WHERE species_id = $${index}
      AND service_id = $${index + 1}
      AND weight_class_id = $${index + 2}
    RETURNING species_id, service_id, weight_class_id,
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
export async function remove(speciesId, serviceId, weightClassId) {
  const sid = validateId(speciesId, 'species_id');
  const srv = validateId(serviceId, 'service_id');
  const wid = validateId(weightClassId, 'weight_class_id');

  const { rowCount } = await pool.query(
    `
    DELETE FROM service_configurations
    WHERE species_id = $1
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
export async function getActiveConfig(speciesId, serviceId, weightClassId) {
  const config = await findOne(speciesId, serviceId, weightClassId);
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
    SELECT species_id, service_id, weight_class_id,
           price, duration_minutes, is_active
    FROM service_configurations
    WHERE service_id = $1
    ORDER BY species_id, weight_class_id
    `,
    [srv]
  );

  return rows;
}