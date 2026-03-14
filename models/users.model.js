import { pool } from "../db.js";
import { isValidEmail, isValidPhone } from "../validators/client.validator.js";
import { bcrypt } from "bcrypt";
import {
  isIdValidNumeric,
  validateNumericId
} from "../validators/validator.js";
import {
  MAX_NAME_LENGTH,
  MAX_PASS_LENGTH,
  MIN_PASS_LENGTH,
  ROLES
} from "../utils/constants.js";

function assertEmailIsValid(email) {
  if (typeof email !== "string" || email.trim() === "") {
    throw new Error("email cannot be null or empty");
  }
  if (!isValidEmail(email)) throw new Error("Email is invalid");
  return true;
}

async function assertEmailNotExists(email) {
  const emailRes = await pool.query(`SELECT email FROM users WHERE email=$1`, [
    email
  ]);
  if (!emailRes.rows[0]) throw new Error("email already exists");
  return true;
}

function assertPasswordIsValid(password) {
  if (password.length < MIN_PASS_LENGTH) {
    throw new Error("password is too short");
  }
  if (password.length > MAX_NAME_LENGTH) {
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

/** Create user */
export async function create({ email, password, phone }) {
  //not null constraint
  email = email.trim();
  assertEmailIsValid();
  assertEmailNotExists(email);
  assertPasswordIsValid(password);
  
  //phone validation
  phone = phone.trim();
  assertPhoneIsValid(phone);

  assertPasswordIsValid(password);

  const hash = await bcrypt.hash(password, 10);
  const role = ROLES.default;
  const is_active = true;

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO users (email, password_hash, role, is_active, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, phone, role, is_active
      `,
      [email, hash, role, is_active, phone]
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
