import * as Pet from "../models/pets.model.js";

function normalizePetPayload(body, { requireWeightClass } = { requireWeightClass: false }) {
  const {
    name,
    breed,
    owner,
    weightClassId,
    weight_class_id,
    pet_species,
    species,
  } = body;

  const resolvedWeightClassId = weightClassId ?? weight_class_id;
  if (requireWeightClass && (resolvedWeightClassId === undefined || resolvedWeightClassId === null)) {
    throw new Error("weightClassId (or weight_class_id) is required");
  }

  const payload = {
    name,
    owner,
    weightClassId: resolvedWeightClassId,
  };

  if ("breed" in body) {
    payload.breed = breed;
  }

  if ("pet_species" in body || "species" in body) {
    payload.pet_species = pet_species ?? species;
  }

  return payload;
}

/**
 * GET /pets/owner/:ownerId
 * Get all pets for a client
 */
export async function getPetsByOwner(req, res) {
  try {
    const { ownerId } = req.params;
    const pets = await Pet.findByOwner(ownerId);
    return res.status(200).json(pets);
  } catch (err) {
    if (err.message.includes("invalid id")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function getAllPets(req, res) {
  try {
     const pets = await Pet.findAll();
     return res.status(200).json(pets ?? []);
   } catch (err) {
     return res.status(500).json({ error: err.message });
   }
}

/**
 * GET /pets/:id
 */
export async function getPetById(req, res) {
  try {
    const { id } = req.params;
    const pet = await Pet.findById(id);

    if (!pet) {
      return res.status(404).json({ error: "pet not found" });
    }

    return res.status(200).json(pet);
  } catch (err) {
    if (err.message.includes("invalid id")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /pets
 */
export async function createPet(req, res) {
  try {
    const createPayload = normalizePetPayload(req.body, { requireWeightClass: true });
    const pet = await Pet.create(createPayload);
    return res.status(201).json(pet);
  } catch (err) {
    if (
      err.message.includes("invalid") ||
      err.message.includes("cannot") ||
      err.message.includes("exceed") ||
      err.message.includes("required")
    ) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /pets/:id
 * Partial update
 */
export async function updatePet(req, res) {
  try {
    const { id } = req.params;
    const updates = normalizePetPayload(req.body);

    const updated = await Pet.update(id, updates);
    return res.status(200).json(updated);
  } catch (err) {
    if (err.message === "pet not found") {
      return res.status(404).json({ error: err.message });
    }

    if (
      err.message.includes("invalid") ||
      err.message.includes("no fields") ||
      err.message.includes("cannot")
    ) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /pets/:id
 */
export async function deletePet(req, res) {
  try {
    const { id } = req.params;
    await Pet.remove(id);
    return res.status(204).send();
  } catch (err) {
    if (err.message === "pet not found") {
      return res.status(404).json({ error: err.message });
    }

    if (err.message.includes("invalid id")) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: err.message });
  }
}
