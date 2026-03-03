import { pool } from "../db.js";
import { isIdValidNumeric, validateNumericId } from "../validators/validator.js";

function validateDayOfWeek(day) {
  const n = Number(day);
  if (!Number.isInteger(n) || n < 0 || n > 6) {
    throw new Error("data validation error: day_of_week must be an integer between 0 and 6");
  }
  return n;
}

function validateTime(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`data validation error: ${label} is required`);
  }

  const time = value.trim();
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
    throw new Error(`data validation error: ${label} must be in HH:MM or HH:MM:SS format`);
  }

  return time;
}

function validateTimeOrder(startTime, endTime) {
  if (startTime >= endTime) {
    throw new Error("data validation error: end_time must be after start_time");
  }
}

export async function findAll() {
  const { rows } = await pool.query(
    `
    SELECT id, stylist_id, day_of_week, start_time, end_time
    FROM stylist_availability
    ORDER BY stylist_id, day_of_week, start_time
    `
  );

  return rows;
}

export async function findById(id) {
  const sanitizedId = validateNumericId(id);

  const { rows } = await pool.query(
    `
    SELECT id, stylist_id, day_of_week, start_time, end_time
    FROM stylist_availability
    WHERE id = $1
    `,
    [sanitizedId]
  );

  return rows[0] ?? null;
}

export async function create({ stylist_id, day_of_week, start_time, end_time }) {
  const stylistId = validateNumericId(stylist_id);
  const day = validateDayOfWeek(day_of_week);
  const startTime = validateTime(start_time, "start_time");
  const endTime = validateTime(end_time, "end_time");
  validateTimeOrder(startTime, endTime);

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO stylist_availability (stylist_id, day_of_week, start_time, end_time)
      VALUES ($1, $2, $3, $4)
      RETURNING id, stylist_id, day_of_week, start_time, end_time
      `,
      [stylistId, day, startTime, endTime]
    );

    return rows[0];
  } catch (err) {
    if (err.code === "23503") {
      throw new Error("data validation error: stylist_id does not exist");
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

  const normalized = {};

  if ("stylist_id" in updates) {
    normalized.stylist_id = validateNumericId(updates.stylist_id);
    fields.push(`stylist_id = $${index++}`);
    values.push(normalized.stylist_id);
  }

  if ("day_of_week" in updates) {
    normalized.day_of_week = validateDayOfWeek(updates.day_of_week);
    fields.push(`day_of_week = $${index++}`);
    values.push(normalized.day_of_week);
  }

  if ("start_time" in updates) {
    normalized.start_time = validateTime(updates.start_time, "start_time");
    fields.push(`start_time = $${index++}`);
    values.push(normalized.start_time);
  }

  if ("end_time" in updates) {
    normalized.end_time = validateTime(updates.end_time, "end_time");
    fields.push(`end_time = $${index++}`);
    values.push(normalized.end_time);
  }

  if ("start_time" in normalized && "end_time" in normalized) {
    validateTimeOrder(normalized.start_time, normalized.end_time);
  }

  if (fields.length === 0) {
    throw new Error("data validation error: no valid fields provided");
  }

  values.push(Number(id));

  try {
    const { rows } = await pool.query(
      `
      UPDATE stylist_availability
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING id, stylist_id, day_of_week, start_time, end_time
      `,
      values
    );

    if (!rows[0]) {
      throw new Error("stylist availability not found");
    }

    return rows[0];
  } catch (err) {
    if (err.code === "23503") {
      throw new Error("data validation error: stylist_id does not exist");
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
    DELETE FROM stylist_availability
    WHERE id = $1
    `,
    [numericId]
  );

  if (rowCount === 0) {
    throw new Error("stylist availability not found");
  }

  return true;
}
