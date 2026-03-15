import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { createAccessToken } from "../utils/jwt.js";
import { generateRefreshToken } from "../utils/tokens.js";


export async function signup(email, password) {
  const hash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1,$2)
     RETURNING id,email`,
    [email, hash]
  );

  return result.rows[0];
}

export async function login(email, password) {
  const result = await pool.query(
    `SELECT * FROM users WHERE email=$1`,
    [email]
  );

  const user = result.rows[0];

  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) throw new Error("Invalid credentials");

  const accessToken = createAccessToken(user.id);
  const refreshToken = generateRefreshToken();

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
    VALUES ($1, $2, now() + interval '7 days')`,
    [user.id, refreshToken]
  )

  return { accessToken, refreshToken };
}