import { randomUUID } from "crypto";
import { pool } from '../db.js'

export function generateRefreshToken() {
    return randomUUID();
}

export async function verifyRefreshToken(token) {
  const result = await pool.query(
    `SELECT user_id FROM refresh_tokens
     WHERE token_hash = $1 AND expires_at > now()`,
    [token]
  );
  if (!result.rowCount) throw new Error("Invalid refresh token");
  return result.rows[0].user_id;
}

export async function rotateRefreshToken(userId, oldToken, newToken) {
  await pool.query(
    `UPDATE refresh_tokens
     SET token_hash=$1, expires_at=now() + interval '7 days'
     WHERE user_id=$2 AND token_hash=$3`,
    [newToken, userId, oldToken]
  );
}