import { pool } from "../db.js";
import { MAX_NAME_LENGTH } from "../utils/constants.js";

/* ----------------------------- helpers ----------------------------- */

function normalizeName(name) {
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("pet name cannot be empty");
  }
  const trimmed = name.trim();
  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new Error(`pet name cannot exceed ${MAX_NAME_LENGTH} characters`);
  }
  return trimmed;
}

function validateId(id) {
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error("invalid id");
  }
  return numeric;
}

/* ----------------------------- queries ----------------------------- */

/**
 * Get all pets for a user
 */
export async function findAll() {
  const { rows } = await pool.query(
    "SELECT id, name, species, owner, uuid, weight_class_id, created_at, updated_at FROM pets ORDER BY id DESC"
  );
  return rows;
}

export async function findByOwner(ownerId) {
  const id = validateId(ownerId);

  const { rows } = await pool.query(
    `
    SELECT p.id, p.name, p.uuid, p.created_at, p.updated_at, p.weight_class_id
           s.id AS species_id, s.name AS species
    FROM pets p
    JOIN species s ON p.species = s.id
    WHERE p.owner = $1
    ORDER BY p.created_at DESC
    `,
    [id]
  );

  return rows;
}

/**
 * Get pet by id
 */
export async function findById(id) {
  const numericId = validateId(id);

  const { rows } = await pool.query(
    `
    SELECT id, name, species, owner, weight_class_id, uuid, created_at, updated_at
    FROM pets
    WHERE id = $1
    `,
    [numericId]
  );

  return rows[0] ?? null;
}

/**
 * Create pet
 */
export async function create({ name, species, owner, weightClassId }) {
  const normalizedName = normalizeName(name);
  const speciesId = validateId(species);
  const ownerId = validateId(owner);
  if (weightClassId) {
    const validatedWeightClassId = validateId(weightClassId);

    try {
      const weightClass = await pool.query(
        `SELECT id FROM weight_classes WHERE id = $1`,
        [validatedWeightClassId]
      );

      if (!weightClass.rows?.length) {
        throw new Error("Invalid weight class");
      }
    } catch (err) {
      if (err.code === "23503") {
        throw new Error("Invalid weight class");
      }
      throw err;
    }
  }
  try {
    const { rows } = await pool.query(
      `
      INSERT INTO pets (name, species, owner, weight_class_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, species, owner, weight_class_id, uuid, created_at, updated_at
      `,
      [normalizedName, speciesId, ownerId, weightClassId]
    );

    return rows[0];
  } catch (err) {
    // FK violation
    if (err.code === "23503") {
      throw new Error("invalid species or owner");
    }
    throw err;
  }
}

/**
 * Update pet (dynamic fields)
 */
export async function update(id, updates) {
  const petId = validateId(id);

  if (!updates || Object.keys(updates).length === 0) {
    throw new Error("no fields provided for update");
  }

  const fields = [];
  const values = [];
  let index = 1;

  // ---- name ----
  if ("name" in updates) {
    const normalized = normalizeName(updates.name);
    fields.push(`name = $${index++}`);
    values.push(normalized);
  }

  // ---- species ----
  if ("species" in updates) {
    const speciesId = validateId(updates.species);
    fields.push(`species = $${index++}`);
    values.push(speciesId);
  }

  if ("weightClassId" in updates) {
    const weightClassId = validateId(updates.weightClassId);

    try {
      await pool.query(`SELECT id FROM weight_classes WHERE id = $1`, [
        weightClassId
      ]);
    } catch (err) {
      if (err.code === "23503") {
        throw new Error("Invalid weight class");
      }
    }

    fields.push(`weight_class_id = $${index++}`);
    values.push(weightClassId);
  }

  if (fields.length === 0) {
    throw new Error("no valid fields provided");
  }

  values.push(petId);

  try {
    const { rows } = await pool.query(
      `
      UPDATE pets
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE id = $${index}
      RETURNING id, name, species, owner, uuid, weight_class_id, created_at, updated_at
      `,
      values
    );

    if (!rows[0]) {
      throw new Error("pet not found");
    }

    return rows[0];
  } catch (err) {
    if (err.code === "23503") {
      throw new Error("invalid species");
    }
    throw err;
  }
}

/**
 * Delete pet
 */
export async function remove(id) {
  const petId = validateId(id);

  const { rowCount } = await pool.query(`DELETE FROM pets WHERE id = $1`, [
    petId
  ]);

  if (rowCount === 0) {
    throw new Error("pet not found");
  }

  return true;
}
