import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { createAccessToken } from "../utils/jwt.js";
import {
  verifyRefreshToken,
  generateRefreshToken,
  rotateRefreshToken,
} from "../utils/tokens.js";

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

  const accessToken = createAccessToken(user.id);
  const refreshToken = generateRefreshToken();

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES ($1, $2, now() + interval '7 days')`,
    [user.id, refreshToken],
  );

  let updateUserRes = await pool.query(
    `UPDATE users
      SET last_login_at = NOW()
      WHERE id = $1
      RETURNING last_login_at`,
    [user.id],
  );

  const last_login_at = updateUserRes?.rows[0]?.last_login_at;
  const { first_name, last_name, phone, role } = user;
  user = {
    first_name,
    last_name,
    email,
    phone,
    role,
    last_login_at,
  };

  return {
    user,
    accessToken,
    refreshToken,
  };
}

export async function refresh(refreshToken) {
  const userId = await verifyRefreshToken(refreshToken); // validate in DB

  const accessToken = createAccessToken(userId);
  const newRefreshToken = generateRefreshToken();

  await rotateRefreshToken(userId, refreshToken, newRefreshToken);

  return { accessToken, newRefreshToken };
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  await pool.query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [
    refreshToken,
  ]);
}

export async function verifyCredentials(email, password) {
  const result = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email,
  ]);

  const user = result.rows[0];
  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error("Invalid credentials");

  // return only safe fields
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    role: user.role,
    last_login_at: user.last_login_at,
  };
}
