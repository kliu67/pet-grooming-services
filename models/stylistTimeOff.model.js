import { pool } from "../db.js";
import { isIdValidNumeric, validateNumericId } from "../validators/validator.js";

function validateDatetime(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`data validation error: ${label} is required`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`data validation error: ${label} must be a valid datetime`);
  }

  return parsed.toISOString();
}

function validateRange(startDatetime, endDatetime) {
  if (new Date(endDatetime) <= new Date(startDatetime)) {
    throw new Error("data validation error: end_datetime must be after start_datetime");
  }
}

function normalizeReason(reason) {
  if (reason == null) return null;
  if (typeof reason !== "string") {
    throw new Error("data validation error: reason must be a string");
  }
  return reason.trim() || null;
}

export async function findAll() {
  const { rows } = await pool.query(
    `
    SELECT id, stylist_id, start_datetime, end_datetime, reason
    FROM stylist_time_offs
    ORDER BY stylist_id, start_datetime
    `
  );

  return rows;
}

export async function findById(id) {
  const sanitizedId = validateNumericId(id);

  const { rows } = await pool.query(
    `
    SELECT id, stylist_id, start_datetime, end_datetime, reason
    FROM stylist_time_offs
    WHERE id = $1
    `,
    [sanitizedId]
  );

  return rows[0] ?? null;
}

export async function findByStylistId(id) {
  const sanitizedId = validateNumericId(id);

  const { rows } = await pool.query(
    `
    SELECT id, stylist_id, start_datetime, end_datetime, reason
    FROM stylist_time_offs
    WHERE stylist_id = $1
    `,
    [sanitizedId]
  );

  return rows;
}


export async function create({ stylist_id, start_datetime, end_datetime, reason }) {
  const stylistId = validateNumericId(stylist_id);
  const startDatetime = validateDatetime(start_datetime, "start_datetime");
  const endDatetime = validateDatetime(end_datetime, "end_datetime");
  const normalizedReason = normalizeReason(reason);
  validateRange(startDatetime, endDatetime);

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO stylist_time_offs (stylist_id, start_datetime, end_datetime, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING id, stylist_id, start_datetime, end_datetime, reason
      `,
      [stylistId, startDatetime, endDatetime, normalizedReason]
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

  if ("start_datetime" in updates) {
    normalized.start_datetime = validateDatetime(updates.start_datetime, "start_datetime");
    fields.push(`start_datetime = $${index++}`);
    values.push(normalized.start_datetime);
  }

  if ("end_datetime" in updates) {
    normalized.end_datetime = validateDatetime(updates.end_datetime, "end_datetime");
    fields.push(`end_datetime = $${index++}`);
    values.push(normalized.end_datetime);
  }

  if ("reason" in updates) {
    normalized.reason = normalizeReason(updates.reason);
    fields.push(`reason = $${index++}`);
    values.push(normalized.reason);
  }

  if ("start_datetime" in normalized && "end_datetime" in normalized) {
    validateRange(normalized.start_datetime, normalized.end_datetime);
  }

  if (fields.length === 0) {
    throw new Error("data validation error: no valid fields provided");
  }

  values.push(Number(id));

  try {
    const { rows } = await pool.query(
      `
      UPDATE stylist_time_offs
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING id, stylist_id, start_datetime, end_datetime, reason
      `,
      values
    );

    if (!rows[0]) {
      throw new Error("stylist time off not found");
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
    DELETE FROM stylist_time_offs
    WHERE id = $1
    `,
    [numericId]
  );

  if (rowCount === 0) {
    throw new Error("stylist time off not found");
  }

  return true;
}
