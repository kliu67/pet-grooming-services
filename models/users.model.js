import { pool } from "../db.js";
import { isValidEmail, isValidPhone } from "../validators/client.validator.js";
import bcrypt from "bcrypt";
import {
  MAX_NAME_LENGTH,
  MAX_PASS_LENGTH,
  MIN_PASS_LENGTH,
  ROLES,
} from "../utils/constants.js";
import { validateNumericId } from "../validators/validator.js";

function assertEmailIsValid(email) {
  if (typeof email !== "string" || email.trim() === "") {
    throw new Error("email cannot be null or empty");
  }
  if (!isValidEmail(email)) throw new Error("Email is invalid");
  return true;
}

async function assertEmailNotExists(email) {
  const emailRes = await pool.query(`SELECT email FROM users WHERE email=$1`, [
    email,
  ]);
  if (emailRes.rows[0]) throw new Error("email already exists");
  return true;
}

function assertNameIsValid(name) {
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("first name and last name cannot be null or empty");
  }

  return true;
}
function assertPasswordIsValid(password) {
  if (password.length < MIN_PASS_LENGTH) {
    throw new Error("password is too short");
  }
  if (password.length > MAX_PASS_LENGTH) {
    throw new Error("password is too long");
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error("Password must contain uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    throw new Error("Password must contain lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    throw new Error("Password must contain a number");
  }

  return true;
}

function assertPhoneIsValid(phone) {
  if (typeof phone !== "string" || phone.trim() === "") {
    throw new Error("phone cannot be null or empty");
  }
  if (!isValidPhone(phone)) throw new Error("invalid phone format");
  return true;
}

/*Get all users */
export async function findAll() {
  const { rows } = await pool.query(
    "SELECT id, email, phone, first_name, last_name, role, is_active FROM users ORDER BY id",
  );
  return rows;
}

/**
 * Get user by id
 */
export async function findById(id) {
  const sanitizedId = validateNumericId(id);
  const { rows } = await pool.query(
    "SELECT id, email, phone, first_name, last_name, role, is_active FROM users WHERE id = $1",
    [sanitizedId],
  );

  return rows[0] ?? null;
}

/** Create user */
export async function create({
  email,
  password,
  phone,
  first_name,
  last_name,
}) {
  email = email.trim();
  phone = phone.trim();
  const firstName = first_name.trim();
  const lastName = last_name.trim();
  assertEmailIsValid(email);
  await assertEmailNotExists(email);
  assertPasswordIsValid(password);
  assertPhoneIsValid(phone);
  assertNameIsValid(firstName);
  assertNameIsValid(lastName);

  const hash = await bcrypt.hash(password, 10);
  const role = ROLES.default;
  const is_active = true;

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO users (email, phone, first_name, last_name, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, phone, first_name, last_name, role, is_active
      `,
      [email, phone, firstName, lastName, hash, role, is_active],
    );
    return rows[0];
  } catch (err) {
    if (err.code === "23505") {
      if (err.constraint === "user_email_key") {
        throw new Error("email already exists");
      }
      throw new Error("duplicate client data");
    }
    throw err;
  }
}
export async function update(email, updates = {}) {}
export async function remove(email) {}
export async function login(email, password){

}
export async function logout(email){

}
