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

function normalizeSpecies(species) {
  if (species === undefined) return null;
  if (species === null) return null;
  if (typeof species !== "string") {
    throw new Error("pet species must be a string");
  }

  const trimmed = species.trim();
  if (trimmed === "") return null;
  if (trimmed.length > 60) {
    throw new Error("pet species cannot exceed 60 characters");
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
 * Get all pets for a client
 */
export async function findAll() {
  const { rows } = await pool.query(
    "SELECT id, name, species AS pet_species, breed, owner, uuid, weight_class_id, created_at, updated_at FROM pets ORDER BY id DESC"
  );
  return rows;
}

export async function findByOwner(ownerId) {
  const id = validateId(ownerId);

  const { rows } = await pool.query(
    `
    SELECT p.id, p.name, p.species AS pet_species, p.uuid, p.created_at, p.updated_at, p.weight_class_id,
           s.id AS breed_id, s.name AS breed
    FROM pets p
    JOIN breeds s ON p.breed = s.id
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
    SELECT id, name, species AS pet_species, breed, owner, weight_class_id, uuid, created_at, updated_at
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
export async function create({
  name,
  breed,
  owner,
  weightClassId,
  weight_class_id,
  pet_species,
  species,
}) {
  const normalizedName = normalizeName(name);
  const normalizedSpecies = normalizeSpecies(pet_species ?? species);
  const breedId = validateId(breed);
  const ownerId = validateId(owner);
  const resolvedWeightClassId = weightClassId ?? weight_class_id;
  const validatedWeightClassId = validateId(resolvedWeightClassId);

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
  try {
    const { rows } = await pool.query(
      `
      INSERT INTO pets (name, species, breed, owner, weight_class_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, species AS pet_species, breed, owner, weight_class_id, uuid, created_at, updated_at
      `,
      [normalizedName, normalizedSpecies, breedId, ownerId, validatedWeightClassId]
    );

    return rows[0];
  } catch (err) {
    // FK violation
    if (err.code === "23503") {
      throw new Error("invalid breed or owner");
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

  if("owner" in updates){
    const ownerId = validateId(updates.owner);
    fields.push(`owner = $${index++}`);
    values.push(ownerId);

      try {
      await pool.query(`SELECT id FROM clients WHERE id = $1`, [
        ownerId
      ]);
    } catch (err) {
      if (err.code === "23503") {
        throw new Error("Invalid owner");
      }
    }
  }

  // ---- breed ----
  if ("breed" in updates) {
    const breedId = validateId(updates.breed);
    fields.push(`breed = $${index++}`);
    values.push(breedId);
  }

  // ---- species ----
  if ("pet_species" in updates || "species" in updates) {
    const normalizedSpecies = normalizeSpecies(
      "pet_species" in updates ? updates.pet_species : updates.species,
    );
    fields.push(`species = $${index++}`);
    values.push(normalizedSpecies);
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
      RETURNING id, name, species AS pet_species, breed, owner, uuid, weight_class_id, created_at, updated_at
      `,
      values
    );

    if (!rows[0]) {
      throw new Error("pet not found");
    }

    return rows[0];
  } catch (err) {
    if (err.code === "23503") {
      throw new Error("invalid breed");
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
