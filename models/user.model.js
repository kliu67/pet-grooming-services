import { pool } from "../db.js";
import { isIdValidNumeric } from "../validators/service.validator.js";
import { isValidEmail } from "../validators/user.validator.js";
const MAX_NAME_LENGTH = 60;
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
  if (!isIdValidNumeric(id)) {
    throw new Error(`data validation error: id ${id} is invalid`);
  }

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
  //not null constraint
  if (typeof full_name !== 'string' || full_name.trim() === '') {
    throw new Error('full name cannot be null or empty');
  }

  full_name = full_name.trim();
  
  if(typeof phone !== 'string' || phone.trim() === ''){
    throw new Error('phone cannot be null or empty');
  }

  //phone validation
  phone = phone.trim();
  if (!isValidPhone(phone)) {
  throw new Error('invalid phone format');
}

  //max length constraint
  if(full_name.length > MAX_NAME_LENGTH){
    throw new Error(`full name cannot exceed ${MAX_NAME_LENGTH} characters`)
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
      INSERT INTO users (full_name, email, phone, description)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email, phone ,description
      `,
      [full_name, email, phone, description ?? null]
    ); 
    return rows[0];
  }

  catch(err){
     if (err.code === '23505') {
    if (err.constraint === 'users_email_key') {
      throw new Error('email already exists');
    }

    if (err.constraint === 'users_phone_key') {
      throw new Error('phone already exists');
    }

    throw new Error('duplicate user data');;
  }
  throw err
  }
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
