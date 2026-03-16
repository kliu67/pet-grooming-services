import { pool } from "../db.js";
import { isValidEmail, isValidPhone } from "../validators/client.validator.js";
import { isIdValidNumeric, validateNumericId } from "../validators/validator.js";
import { MAX_NAME_LENGTH } from "../utils/constants.js";

function normalizeName(value, fieldLabel) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`data validation error: ${fieldLabel} cannot be null or empty`);
  }

  const trimmed = value.trim();
  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new Error(
      `data validation error: ${fieldLabel} cannot exceed ${MAX_NAME_LENGTH} characters`
    );
  }

  return trimmed;
}

function normalizeEmail(value) {
  const email = value?.trim().toLowerCase() ?? null;

  if (email && !isValidEmail(email)) {
    throw new Error("data validation error: invalid email format");
  }

  return email;
}

function normalizePhone(value) {
  const phone = value?.trim() ?? null;

  if (phone && !isValidPhone(phone)) {
    throw new Error("data validation error: invalid phone format");
  }

  return phone;
}

export async function findAll() {
  const { rows } = await pool.query(
    `
    SELECT id, first_name, last_name, email, phone, is_active, uuid, created_at
    FROM stylists
    ORDER BY id
    `
  );

  return rows;
}

export async function findById(id) {
  const sanitizedId = validateNumericId(id);

  const { rows } = await pool.query(
    `
    SELECT id, first_name, last_name, email, phone, is_active, uuid, created_at
    FROM stylists
    WHERE id = $1
    `,
    [sanitizedId]
  );

  return rows[0] ?? null;
}

export async function create({ first_name, last_name, email, phone, is_active }) {
  const normalizedFirstName = normalizeName(first_name, "first_name");
  const normalizedLastName = normalizeName(last_name, "last_name");
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  const active = is_active === undefined ? true : Boolean(is_active);

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO stylists (first_name, last_name, email, phone, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, first_name, last_name, email, phone, is_active, uuid, created_at
      `,
      [normalizedFirstName, normalizedLastName, normalizedEmail, normalizedPhone, active]
    );

    return rows[0];
  } catch (err) {
    if (err.code === "23505" && err.constraint === "stylists_email_key") {
      throw new Error("data validation error: email already exists");
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

  if ("first_name" in updates) {
    fields.push(`first_name = $${index++}`);
    values.push(normalizeName(updates.first_name, "first_name"));
  }

  if ("last_name" in updates) {
    fields.push(`last_name = $${index++}`);
    values.push(normalizeName(updates.last_name, "last_name"));
  }

  if ("email" in updates) {
    fields.push(`email = $${index++}`);
    values.push(normalizeEmail(updates.email));
  }

  if ("phone" in updates) {
    fields.push(`phone = $${index++}`);
    values.push(normalizePhone(updates.phone));
  }

  if ("is_active" in updates) {
    if (typeof updates.is_active !== "boolean") {
      throw new Error("data validation error: is_active must be boolean");
    }
    fields.push(`is_active = $${index++}`);
    values.push(updates.is_active);
  }

  if (fields.length === 0) {
    throw new Error("data validation error: no valid fields provided");
  }

  values.push(Number(id));

  try {
    const { rows } = await pool.query(
      `
      UPDATE stylists
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING id, first_name, last_name, email, phone, is_active, uuid, created_at
      `,
      values
    );

    if (!rows[0]) {
      throw new Error("stylist not found");
    }

    return rows[0];
  } catch (err) {
    if (err.code === "23505" && err.constraint === "stylists_email_key") {
      throw new Error("data validation error: email already exists");
    }
    throw err;
  }
}

export async function remove(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error("data validation error: invalid id");
  }

  const { rowCount } = await pool.query(
    `
    DELETE FROM stylists
    WHERE id = $1
    `,
    [numericId]
  );

  if (rowCount === 0) {
    throw new Error("stylist not found");
  }

  return true;
}
