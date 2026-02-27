import { pool } from "../db.js";
import { isValidEmail, isValidPhone } from "../validators/user.validator.js";
import { isIdValidNumeric, validateNumericId } from "../validators/validator.js";
import { MAX_NAME_LENGTH } from "../utils/constants.js";
/**
 * Get all users
 */
export async function findAll() {
  const { rows } = await pool.query(
    "SELECT id, first_name, last_name, email, phone, description, created_at FROM users ORDER BY id DESC"
  );
  return rows;
}

/**
 * Get item by id
 */
export async function findById(id) {
  const sanitizedId = validateNumericId(id);

  const { rows } = await pool.query(
    "SELECT id, first_name, last_name, email, phone, description, created_at FROM users WHERE id = $1",
    [sanitizedId]
  );

  return rows[0] ?? null;
}

/**
 * Create item
 */
export async function create({ first_name, last_name, email, phone, description }) {
  //not null constraint
  if (typeof first_name !== 'string' || first_name.trim() === '' || typeof last_name !== 'string' || last_name.trim() === '') {
    throw new Error('first name and last name cannot be null or empty');
  }

  first_name = first_name.trim();
  last_name = last_name.trim();
  
  if(typeof phone !== 'string' || phone.trim() === ''){
    throw new Error('phone cannot be null or empty');
  }

  //phone validation
  phone = phone.trim();
  if (!isValidPhone(phone)) {
  throw new Error('invalid phone format');
}

  //max length constraint
  if(first_name.length > MAX_NAME_LENGTH){
    throw new Error(`first name cannot exceed ${MAX_NAME_LENGTH} characters`)
  }

  if(last_name.length > MAX_NAME_LENGTH){
    throw new Error(`last name cannot exceed ${MAX_NAME_LENGTH} characters`)
  }

  //email validation

  email = email?.trim().toLowerCase() ?? null;
  if (email && !isValidEmail(email)) {
  throw new Error('invalid email format');
  }


  //validate description
  if (description != null && typeof description !== 'string') {
  throw new Error('description must be a string');
}

  try{
    const { rows } = await pool.query(
      `
      INSERT INTO users (first_name, last_name, email, phone, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, first_name, last_name, email, phone ,description
      `,
      [first_name, last_name, email, phone, description ?? null]
    ); 
    return rows[0];
  }

  catch(err){
     if (err.code === '23505') {
    if (err.constraint === 'users_email_key') {
      throw new Error('email already exists');
    }

    if (err.constraint === 'users_first_name_last_name_phone_key') {
      throw new Error('user with this first name, last name, and phone already exists');
    }

    throw new Error('duplicate user data');
  }
  throw err
  }
}

/**
 * Update item
 */
export async function update(id, updates) {

  if (!isIdValidNumeric(id)) {
    throw new Error('invalid id');
  }

  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('no fields provided for update');
  }

  const fields = [];
  const values = [];
  let index = 1;

  // ---- first_name ----
  if ('first_name' in updates) {
    const first_name = updates.first_name;

    if (typeof first_name !== 'string' || first_name.trim() === '') {
      throw new Error('first name cannot be empty');
    }

    const trimmed = first_name.trim();

    if (trimmed.length > MAX_NAME_LENGTH) {
      throw new Error(`first name cannot exceed ${MAX_NAME_LENGTH} characters`);
    }

    fields.push(`first_name = $${index++}`);
    values.push(trimmed);
  }

  // ---- last_name ----
  if ('last_name' in updates) {
    const last_name = updates.last_name;

    if (typeof last_name !== 'string' || last_name.trim() === '') {
      throw new Error('last name cannot be empty');
    }

    const trimmed = last_name.trim();

    if (trimmed.length > MAX_NAME_LENGTH) {
      throw new Error(`last name cannot exceed ${MAX_NAME_LENGTH} characters`);
    }

    fields.push(`last_name = $${index++}`);
    values.push(trimmed);
  }

  // ---- email ----
  if ('email' in updates) {
    let email = updates.email;

    email = email?.trim().toLowerCase() ?? null;

    if (email && !isValidEmail(email)) {
      throw new Error('invalid email format');
    }

    fields.push(`email = $${index++}`);
    values.push(email);
  }

  // ---- phone ----
  if ('phone' in updates) {
    const phone = updates.phone;

    if (typeof phone !== 'string' || phone.trim() === '') {
      throw new Error('phone cannot be empty');
    }

    const trimmed_phone = phone.trim();

    fields.push(`phone = $${index++}`);
    values.push(trimmed_phone);
  }

  // ---- description ----
  if ('description' in updates) {
    const desc = updates.description;

    if (desc != null && typeof desc !== 'string') {
      throw new Error('description must be a string');
    }

    fields.push(`description = $${index++}`);
    values.push(desc ?? null);
  }

  if (fields.length === 0) {
    throw new Error('no valid fields provided');
  }

  values.push(id);

  try {
    const { rows } = await pool.query(
      `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING id, first_name, last_name, email, phone, description
      `,
      values
    );

    if (!rows[0]) {
      throw new Error('user not found');
    }

    return rows[0];

  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint === 'users_email_key') {
        throw new Error('email already exists');
      }
      if (err.constraint === 'users_first_name_last_name_phone_key') {
        throw new Error('user with this first name, last name, and phone already exists');
      }
      throw new Error('duplicate user data');
    }

    throw err;
  }
}

/**
 * Delete item
 */
export async function remove(id) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error('invalid id');
  }

  try {
    const { rowCount } = await pool.query(
      `
      DELETE FROM users
      WHERE id = $1
      `,
      [numericId]
    );

    if (rowCount === 0) {
      throw new Error('user not found');
    }

    return true; // deletion successful

  } catch (err) {
    throw err; // never swallow unknown DB errors
  }
}

