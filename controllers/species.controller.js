import * as Species from "../models/species.model.js";

/**
 * GET /species
 */
export async function getAllSpecies(req, res) {
  try {
    const species = await Species.findAll();
    return res.status(200).json(species);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /species/:id
 */
export async function getSpeciesById(req, res) {
  try {
    const { id } = req.params;
    const species = await Species.findById(id);

    if (!species) {
      return res.status(404).json({ error: "species not found" });
    }

    return res.status(200).json(species);
  } catch (err) {
    if (err.message.includes("invalid id")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /species
 */
export async function createSpecies(req, res) {
  try {
    const { name } = req.body;
    const created = await Species.create(name);

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

/**
 * DELETE /species/:id
 */
export async function deleteSpecies(req, res) {
  try {
    const { id } = req.params;
    await Species.remove(id);

    return res.status(204).send();
  } catch (err) {
    if (err.message === "species not found") {
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
