import { pool } from '../db.js';

/* ---------------- helpers ---------------- */

function validateId(id, name = 'id') {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`invalid ${name}`);
  }
  return n;
}

function validateTime(startTime) {
  const t = new Date(startTime);
  if (isNaN(t.getTime())) {
    throw new Error('invalid start_time');
  }
  return t;
}

/* ---------------- booking (transaction-safe) ---------------- */

/**
 * Book appointment safely (no race conditions)
 */
export async function book({
  user_id,
  pet_id,
  service_id,
  start_time,
  description = null,
}) {
  const userId = validateId(user_id, 'user_id');
  const petId = validateId(pet_id, 'pet_id');
  const serviceId = validateId(service_id, 'service_id');
  const start = validateTime(start_time);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ---- Lock pet row (prevents concurrent booking races) ----
    const petRes = await client.query(
      `
      SELECT id, species, weight_class
      FROM pets
      WHERE id = $1
      FOR UPDATE
      `,
      [petId]
    );

    if (!petRes.rows[0]) {
      throw new Error('pet not found');
    }

    const { species, weight_class } = petRes.rows[0];

    // ---- Fetch active service configuration ----
    const cfgRes = await client.query(
      `
      SELECT price, duration_minutes
      FROM service_configurations
      WHERE species_id = $1
        AND service_id = $2
        AND weight_class_id = $3
        AND is_active = TRUE
      `,
      [species, serviceId, weight_class]
    );

    if (!cfgRes.rows[0]) {
      throw new Error('service configuration not found');
    }

    const { price, duration_minutes } = cfgRes.rows[0];

    // ---- Compute end_time ----
    const end = new Date(start.getTime() + duration_minutes * 60000);

    // ---- Insert appointment (exclusion constraint prevents overlap) ----
    const insertRes = await client.query(
      `
      INSERT INTO appointments
        (user_id, pet_id, service_id,
         start_time, end_time,
         price_snapshot, duration_snapshot,
         description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        userId,
        petId,
        serviceId,
        start,
        end,
        price,
        duration_minutes,
        description,
      ]
    );

    await client.query('COMMIT');
    return insertRes.rows[0];

  } catch (err) {
    await client.query('ROLLBACK');

    // Overlap exclusion violation
    if (err.code === '23P01') {
      throw new Error('appointment overlaps existing booking');
    }

    // FK violation
    if (err.code === '23503') {
      throw new Error('invalid user, pet, or service');
    }

    throw err;

  } finally {
    client.release();
  }
}

/* ---------------- basic queries ---------------- */

export async function findById(id) {
  const numericId = validateId(id);

  const { rows } = await pool.query(
    `SELECT * FROM appointments WHERE id = $1`,
    [numericId]
  );

  return rows[0] ?? null;
}

export async function cancel(id) {
  const numericId = validateId(id);

  const { rows } = await pool.query(
    `
    UPDATE appointments
    SET status = 'cancelled'
    WHERE id = $1
    RETURNING *
    `,
    [numericId]
  );

  if (!rows[0]) {
    throw new Error('appointment not found');
  }

  return rows[0];
}

export async function reschedule(id, newStartTime) {
  const numericId = validateId(id);
  const start = validateTime(newStartTime);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const apptRes = await client.query(
      `SELECT * FROM appointments WHERE id = $1 FOR UPDATE`,
      [numericId]
    );

    if (!apptRes.rows[0]) {
      throw new Error('appointment not found');
    }

    const { duration_snapshot } = apptRes.rows[0];
    const end = new Date(start.getTime() + duration_snapshot * 60000);

    const updateRes = await client.query(
      `
      UPDATE appointments
      SET start_time = $1,
          end_time   = $2,
          status     = 'booked'
      WHERE id = $3
      RETURNING *
      `,
      [start, end, numericId]
    );

    await client.query('COMMIT');
    return updateRes.rows[0];

  } catch (err) {
    await client.query('ROLLBACK');

    if (err.code === '23P01') {
      throw new Error('new time overlaps existing booking');
    }

    throw err;

  } finally {
    client.release();
  }
}