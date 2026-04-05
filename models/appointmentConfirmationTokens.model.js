import crypto from "crypto";
import { pool } from "../db.js";
import { isIdValidNumeric, validateNumericId } from "../validators/validator.js";


function generateConfirmationToken() {
  return crypto.randomBytes(32).toString("base64url"); // URL-safe
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function validateTokenHash(tokenHash) {
  if (typeof tokenHash !== "string" || tokenHash.trim() === "") {
    throw new Error("data validation error: token_hash is required");
  }
  return tokenHash.trim();
}

function validateDatetime(value, label, { required = true } = {}) {
  if (value == null) {
    if (required) {
      throw new Error(`data validation error: ${label} is required`);
    }
    return null;
  }

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`data validation error: ${label} must be a valid datetime`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`data validation error: ${label} must be a valid datetime`);
  }

  return parsed.toISOString();
}

export async function findAll() {
  const { rows } = await pool.query(
    `
    SELECT id, appointment_id, token_hash, expires_at, revoked_at, created_at
    FROM appointment_confirmation_tokens
    ORDER BY id
    `,
  );

  return rows ?? [];
}

export async function findById(id) {
  const tokenId = validateNumericId(id);

  const { rows } = await pool.query(
    `
    SELECT id, appointment_id, token_hash, expires_at, revoked_at, created_at
    FROM appointment_confirmation_tokens
    WHERE id = $1
    `,
    [tokenId],
  );

  return rows[0] ?? null;
}

export async function findByAppointmentId(appointmentId) {
  const sanitizedAppointmentId = validateNumericId(appointmentId);

  const { rows } = await pool.query(
    `
    SELECT id, appointment_id, token_hash, expires_at, revoked_at, created_at
    FROM appointment_confirmation_tokens
    WHERE appointment_id = $1
    ORDER BY created_at DESC
    `,
    [sanitizedAppointmentId],
  );

  return rows ?? [];
}

export async function create({
  appointment_id,
  expires_at,
  revoked_at = null,
}) {
  const appointmentId = validateNumericId(appointment_id);
  const expiresAt = validateDatetime(expires_at, "expires_at");
  const revokedAt = validateDatetime(revoked_at, "revoked_at", {
    required: false,
  });

  const token = generateConfirmationToken();
  const tokenHash = hashToken(token);


  try {
    const { rows } = await pool.query(
      `
      INSERT INTO appointment_confirmation_tokens
        (appointment_id, token_hash, expires_at, revoked_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, appointment_id, token_hash, expires_at, revoked_at, created_at
      `,
      [appointmentId, tokenHash, expiresAt, revokedAt],
    );

    return {...rows[0], token};
  } catch (err) {
    if (err.code === "23503") {
      throw new Error("data validation error: appointment_id does not exist");
    }
    if (err.code === "23505") {
      throw new Error("token hash already exists");
    }
    throw err;
  }
}

export async function update(id, updates) {
  if (!isIdValidNumeric(id)) {
    throw new Error("data validation error: invalid id");
  }

  if (!updates || Object.keys(updates).length === 0) {
    throw new Error("data validation error: no fields provided for update");
  }

  const fields = [];
  const values = [];
  let index = 1;

  if ("appointment_id" in updates) {
    fields.push(`appointment_id = $${index++}`);
    values.push(validateNumericId(updates.appointment_id));
  }

  if ("token_hash" in updates) {
    fields.push(`token_hash = $${index++}`);
    values.push(validateTokenHash(updates.token_hash));
  }

  if ("expires_at" in updates) {
    fields.push(`expires_at = $${index++}`);
    values.push(validateDatetime(updates.expires_at, "expires_at"));
  }

  if ("revoked_at" in updates) {
    fields.push(`revoked_at = $${index++}`);
    values.push(
      validateDatetime(updates.revoked_at, "revoked_at", { required: false }),
    );
  }

  if (fields.length === 0) {
    throw new Error("data validation error: no valid fields provided");
  }

  values.push(Number(id));

  try {
    const { rows } = await pool.query(
      `
      UPDATE appointment_confirmation_tokens
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING id, appointment_id, token_hash, expires_at, revoked_at, created_at
      `,
      values,
    );

    if (!rows[0]) {
      throw new Error("appointment confirmation token not found");
    }

    return rows[0];
  } catch (err) {
    if (err.code === "23503") {
      throw new Error("data validation error: appointment_id does not exist");
    }
    if (err.code === "23505") {
      throw new Error("token hash already exists");
    }
    throw err;
  }
}

export async function remove(id) {
  const tokenId = validateNumericId(id);

  const { rowCount } = await pool.query(
    `
    DELETE FROM appointment_confirmation_tokens
    WHERE id = $1
    `,
    [tokenId],
  );

  if (rowCount === 0) {
    throw new Error("appointment confirmation token not found");
  }

  return true;
}
