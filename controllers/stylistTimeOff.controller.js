import * as StylistTimeOff from "../models/stylistTimeOff.model.js";

export async function getAllStylistTimeOff(req, res) {
  try {
    const rows = await StylistTimeOff.findAll();
    return res.status(200).json(rows ?? []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getUpcomingStylistTimeOffByStylistId(req, res) {
  try {
    const { stylistId } = req.params;
    const rows = await StylistTimeOff.findUpcomingByStylistId(stylistId);
    return res.status(200).json(rows ?? []);
  } catch (err) {
    if (err.message.includes("validation") || err.message.includes("ID")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function getStylistTimeOffById(req, res) {
  try {
    const { id } = req.params;
    const row = await StylistTimeOff.findById(id);

    if (!row) {
      return res.status(404).json({ error: "stylist time off not found" });
    }

    return res.status(200).json(row);
  } catch (err) {
    if (err.message.includes("validation") || err.message.includes("ID")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function getStylistTimeOffByStylistId(req, res) {
  try {
    const { stylistId } = req.params;
    const row = await StylistTimeOff.findByStylistId(stylistId);

    if (!row) {
      return res.status(404).json({ error: `time off for ${stylistId} not found` });
    }

    return res.status(200).json(row);
  } catch (err) {
    if (err.message.includes("validation") || err.message.includes("ID")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function createStylistTimeOff(req, res) {
  try {
    const { stylist_id, start_datetime, end_datetime, reason } = req.body;
    const created = await StylistTimeOff.create({
      stylist_id,
      start_datetime,
      end_datetime,
      reason,
    });

    return res.status(201).json(created);
  } catch (err) {
    if (err.message.includes("validation") || err.message.includes("ID")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function updateStylistTimeOff(req, res) {
  try {
    const { id } = req.params;
    const updated = await StylistTimeOff.update(id, req.body);

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

export async function deleteStylistTimeOff(req, res) {
  try {
    const { id } = req.params;
    await StylistTimeOff.remove(id);

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
