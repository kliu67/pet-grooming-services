import bcrypt from "bcrypt";
import { pool } from "../db.js";


export async function signup(email, password) {
  const hash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1,$2)
     RETURNING id,email`,
    [email, hash],
  );

  return result.rows[0];
}

export async function login(email, password) {
  const result = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email,
  ]);

  let user = result.rows[0];

  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) throw new Error("Invalid credentials");

  let updateUserRes = await pool.query(
    `UPDATE users
      SET last_login_at = NOW()
      WHERE id = $1
      RETURNING last_login_at`,
    [user.id],
  );

  const last_login_at = updateUserRes?.rows[0]?.last_login_at;
  const { id, first_name, last_name, phone, role } = user;
  user = {
    id,
    first_name,
    last_name,
    email,
    phone,
    role,
    last_login_at,
  };

  return user;
}

export async function getSessionUser(userId) {
  const result = await pool.query(
    `SELECT id, email, phone, first_name, last_name, role, last_login_at
     FROM users
     WHERE id = $1`,
    [userId]
  );

  return result.rows[0] ?? null;
}
