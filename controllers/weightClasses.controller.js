import * as WeightClass from "../models/weightClasses.model.js";

/**
 * GET /weight-classes
 */
export async function getAllWeightClasses(req, res) {
  try {
    const rows = await WeightClass.findAll();
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /weight-classes/:id
 */
export async function getWeightClassById(req, res) {
  try {
    const { id } = req.params;
    const row = await WeightClass.findById(id);

    if (!row) {
      return res.status(404).json({ error: "weight class not found" });
    }

    return res.status(200).json(row);
  } catch (err) {
    if (err.message.includes("invalid id")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /weight-classes
 */
export async function createWeightClass(req, res) {
  try {
    const { label } = req.body;
    const created = await WeightClass.create(label);

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
 * DELETE /weight-classes/:id
 */
export async function deleteWeightClass(req, res) {
  try {
    const { id } = req.params;
    await WeightClass.remove(id);

    return res.status(204).send();
  } catch (err) {
    if (err.message === "weight class not found") {
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
