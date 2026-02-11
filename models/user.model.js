import { pool } from "../db.js";

/**
 * Get all users
 */
export async function findAll() {
  const { rows } = await pool.query(
    "SELECT id, full_name, email, phone, description, created_at FROM users ORDER BY id DESC"
  );
  return rows;
}

/**
 * Get item by id
 */
export async function findById(id) {
  const { rows } = await pool.query(
    "SELECT id, full_name, email, phone, description, created_at FROM users WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Create item
 */
export async function create({ full_name, email, phone, description }) {
  const { rows } = await pool.query(
    `
    INSERT INTO users (full_name, email, phone, description)
    VALUES ($1, $2, $3, $4)
    RETURNING id, full_name, email, phone ,description
    `,
    [full_name, email, phone, description]
  );

  return rows[0];
}

/**
 * Update item
 */
export async function update(id, { full_name, email, phone, description }) {
  const { rows } = await pool.query(
    `
    UPDATE users
    SET full_name = $1, email = $2, phone = $3, description = $4
    WHERE id = $5
    RETURNING id, full_name, email, phone, description
    `,
    [full_name, email, phone, description, id]
  );

  return rows[0] ?? null;
}

/**
 * Delete item
 */
export async function remove(id) {
  const { rowCount } = await pool.query(
    "DELETE FROM users WHERE id = $1",
    [id]
  );
  return rowCount > 0;
}
