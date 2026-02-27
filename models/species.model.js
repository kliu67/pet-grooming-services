import { pool } from '../db.js';
import { isIdValidNumeric } from  "../validators/validator.js";


function normalizeName(name) {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new Error('invalid species name');
  }
  return name.trim();
}

/**
 * Get all species
 */
export async function findAll() {
  const { rows } = await pool.query(
    `SELECT id, name, created_at FROM species ORDER BY name ASC`
  );
  return rows;
}

/**
 * Get species by id
 */
export async function findById(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error('invalid id');
  }

  const { rows } = await pool.query(
    `SELECT id, name, created_at FROM species WHERE id = $1`,
    [numericId]
  );

  return rows[0] ?? null;
}

/**
 * Create species
 */
export async function create(name) {
  const normalized = normalizeName(name);

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO species (name)
      VALUES ($1)
      RETURNING id, name, created_at
      `,
      [normalized]
    );

    return rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new Error('species already exists');
    }
    throw err;
  }
}

export async function update(id, {name=''}){
  if (!isIdValidNumeric(id)) {
    throw new Error(`data validation error: id ${id} is invalid`);
  }
    if(!name){
        throw new Error('data validation error: name cannot be empty, null, or undefined')
    }

    const {rows} = await pool.query(
        `
        UPDATE species
        SET name = $1
        WHERE id = $2
        RETURNING *`,
        [name, id]
    )
    
    if(!rows[0]){
        throw new Error(`Service with id ${id} not found`);
    }

    return rows[0];
}

/**
 * Delete species (only if not referenced)
 */
export async function remove(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error('invalid id');
  }

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM species WHERE id = $1`,
      [numericId]
    );

    if (rowCount === 0) {
      throw new Error('species not found');
    }

    return true;
  } catch (err) {
    // FK violation → species in use by pets
    if (err.code === '23503') {
      throw new Error('cannot delete species in use');
    }
    throw err;
  }
}