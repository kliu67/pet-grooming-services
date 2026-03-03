import * as StylistAvailability from "../models/stylistAvailability.model.js";

export async function getAllStylistAvailability(req, res) {
  try {
    const rows = await StylistAvailability.findAll();
    return res.status(200).json(rows ?? []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getStylistAvailabilityById(req, res) {
  try {
    const { id } = req.params;
    const row = await StylistAvailability.findById(id);

    if (!row) {
      return res.status(404).json({ error: "stylist availability not found" });
    }

    return res.status(200).json(row);
  } catch (err) {
    if (err.message.includes("validation") || err.message.includes("ID")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function createStylistAvailability(req, res) {
  try {
    const { stylist_id, day_of_week, start_time, end_time } = req.body;
    const created = await StylistAvailability.create({
      stylist_id,
      day_of_week,
      start_time,
      end_time,
    });

    return res.status(201).json(created);
  } catch (err) {
    if (err.message.includes("validation") || err.message.includes("ID")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function updateStylistAvailability(req, res) {
  try {
    const { id } = req.params;
    const updated = await StylistAvailability.update(id, req.body);

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

export async function deleteStylistAvailability(req, res) {
  try {
    const { id } = req.params;
    await StylistAvailability.remove(id);

    return res.status(204).send();
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
