import { pool } from '../db.js';

/* ---------------- helpers ---------------- */

function normalizeLabel(label) {
  if (typeof label !== 'string' || label.trim() === '') {
    throw new Error('invalid weight class label');
  }
  return label.trim();
}

function validateId(id) {
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error('invalid id');
  }
  return numeric;
}

/* ---------------- queries ---------------- */

/**
 * Get all weight classes
 */
export async function findAll() {
  const { rows } = await pool.query(
    `SELECT id, label, code, jsonb_build_array(lower(weight_range), upper(weight_range)) AS weight_bounds FROM weight_classes ORDER BY id ASC`
  );
  return rows;
}

/**
 * Get by id
 */
export async function findById(id) {
  const numericId = validateId(id);

  const { rows } = await pool.query(
    `SELECT id, label, code, jsonb_build_array(lower(weight_range), upper(weight_range)) AS weight_bounds FROM weight_classes WHERE id = $1`,
    [numericId]
  );

  return rows[0] ?? null;
}

/**
 * Create weight class
 */
export async function create(label) {
  const normalized = normalizeLabel(label);
  const code = normalized.toUpperCase().replaceAll(" ", "_");
  try {
    const { rows } = await pool.query(
      `
      INSERT INTO weight_classes (label, code)
      VALUES ($1, $2)
      RETURNING id, label
      `,
      [normalized, code]
    );

    return rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new Error('weight class already exists');
    }
    throw err;
  }
}

/**
 * Delete weight class
 */
export async function remove(id) {
  const numericId = validateId(id);

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM weight_classes WHERE id = $1`,
      [numericId]
    );

    if (rowCount === 0) {
      throw new Error('weight class not found');
    }

    return true;

  } catch (err) {
    // FK violation (weight class used by pets)
    if (err.code === '23503') {
      throw new Error('cannot delete weight class in use');
    }
    throw err;
  }
}