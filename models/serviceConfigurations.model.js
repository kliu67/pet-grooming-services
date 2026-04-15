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

function validateBuffer(minutes) {
  if (minutes === undefined || minutes === null) {
    return 0;
  }

  const n = Number(minutes);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('invalid buffer');
  }
  return n;
}

/* ---------------- CRUD ---------------- */
/**
 * Get all configurations
 */

export async function findAll(){
    const { rows } = await pool.query(
        `SELECT id, service_id, weight_class_id, price, duration_minutes, buffer_minutes, is_active, created_at, updated_at FROM service_configurations`
    )
    return rows ?? null;
}
/**
 * Get configuration by composite key
 */
export async function findOne(serviceId, weightClassId) {
  const srv = validateId(serviceId, 'service_id');
  const wid = validateId(weightClassId, 'weight_class_id');

  const { rows } = await pool.query(
    `
    SELECT id, service_id, weight_class_id,
           price, duration_minutes, buffer_minutes, is_active
    FROM service_configurations
    WHERE service_id = $1
      AND weight_class_id = $2
    `,
    [srv, wid]
  );

  return rows[0] ?? null;
}

/**
 * Create configuration
 */
export async function create({
  service_id,
  weight_class_id,
  price,
  duration_minutes,
  buffer_minutes,
  is_active = true,
}) {
  const srv = validateId(service_id, 'service_id');
  const wid = validateId(weight_class_id, 'weight_class_id');
  const p = validatePrice(price);
  const d = validateDuration(duration_minutes);
  const b = validateBuffer(buffer_minutes);

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO service_configurations
        (service_id, weight_class_id, price, duration_minutes, buffer_minutes, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING service_id, weight_class_id,
                price, duration_minutes, is_active
      `,
      [srv, wid, p, d, b, is_active]
    );

    return rows[0];

  } catch (err) {
    if (err.code === '23505') {
      throw new Error('configuration already exists');
    }
    if (err.code === '23503') {
      throw new Error('invalid service or weight class');
    }
    throw err;
  }
}

/**
 * Update configuration (partial update allowed)
 */
export async function update(
  serviceId,
  weightClassId,
  updates
) {
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
    values.push(validateBuffer(updates.buffer_minutes));
  }

  if ('is_active' in updates) {
    fields.push(`is_active = $${index++}`);
    values.push(Boolean(updates.is_active));
  }

  if (fields.length === 0) {
    throw new Error('no valid fields provided');
  }

  values.push(srv, wid);

  const { rows } = await pool.query(
    `
    UPDATE service_configurations
    SET ${fields.join(', ')}
    WHERE service_id = $${index}
      AND weight_class_id = $${index + 1}
    RETURNING service_id, weight_class_id,
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
export async function remove(serviceId, weightClassId) {
  const srv = validateId(serviceId, 'service_id');
  const wid = validateId(weightClassId, 'weight_class_id');

  const { rowCount } = await pool.query(
    `
    DELETE FROM service_configurations
    WHERE service_id = $1
      AND weight_class_id = $2
    `,
    [srv, wid]
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
export async function getActiveConfig(serviceId, weightClassId) {
  const config = await findOne(serviceId, weightClassId);
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
    SELECT service_id, weight_class_id,
           price, duration_minutes, is_active
    FROM service_configurations
    WHERE service_id = $1
    ORDER BY weight_class_id
    `,
    [srv]
  );

  return rows;
}

/**
 * List all configs for a service grouped by weight class
 */
export async function findByServiceGroupedByWeightClass(serviceId) {
  const srv = validateId(serviceId, 'service_id');

  const { rows } = await pool.query(
    `
    SELECT DISTINCT ON (sc.weight_class_id)
           sc.id, sc.service_id, sc.weight_class_id,
           sc.price, sc.duration_minutes, sc.buffer_minutes, sc.is_active,
           wc.label AS weight_class_label,
           jsonb_build_array(lower(wc.weight_range), upper(wc.weight_range)) AS weight_class_range
    FROM service_configurations sc
    JOIN weight_classes wc ON wc.id = sc.weight_class_id
    WHERE sc.service_id = $1
    ORDER BY sc.weight_class_id
    `,
    [srv]
  );

  return rows;
}
