import * as Breed from "../models/breeds.model.js";

/**
 * GET /breed
 */
export async function getAllBreeds(req, res) {
  try {
    const breed = await Breed.findAll();
    return res.status(200).json(breed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /breed/:id
 */
export async function getBreedById(req, res) {
  try {
    const { id } = req.params;
    const breed = await Breed.findById(id);

    if (!breed) {
      return res.status(404).json({ error: "breed not found" });
    }

    return res.status(200).json(breed);
  } catch (err) {
    if (err.message.includes("invalid id")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /breed
 */
export async function createBreed(req, res) {
  try {
    const { name } = req.body;
    const created = await Breed.create(name);

    return res.status(201).json(created);
  } catch (err) {
    if (
      err.message.includes("invalid") ||
      err.message.includes("exists")
    ) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/** *UPDATE /breed/:id
 * 
 */
export async function updateBreed(req, res) {
  console.log("Incoming body:", req.body);
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updated = await Breed.update(id, { name });
    return res.status(200).json(updated);
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes("validation")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /breed/:id
 */
export async function deleteBreed(req, res) {
  try {
    const { id } = req.params;
    await Breed.remove(id);

    return res.status(204).send();
  } catch (err) {
    if (err.message === "breed not found") {
      return res.status(404).json({ error: err.message });
    }

    if (
      err.message.includes("invalid id") ||
      err.message.includes("cannot delete")
    ) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: err.message });
  }
}
