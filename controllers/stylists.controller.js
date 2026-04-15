import * as Stylist from "../models/stylists.model.js";

export async function getAllStylists(req, res) {
  try {
    const stylists = await Stylist.findAll();
    return res.status(200).json(stylists ?? []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getStylistById(req, res) {
  try {
    const { id } = req.params;
    const stylist = await Stylist.findById(id);

    if (!stylist) {
      return res.status(404).json({ error: "stylist not found" });
    }

    return res.status(200).json(stylist);
  } catch (err) {
    if (err.message.includes("ID") || err.message.includes("validation")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function createStylist(req, res) {
  try {
    const { first_name, last_name, email, phone, is_active } = req.body;
    const created = await Stylist.create({
      first_name,
      last_name,
      email,
      phone,
      is_active,
    });

    return res.status(201).json(created);
  } catch (err) {
    if (err.message.includes("validation")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function updateStylist(req, res) {
  try {
    const { id } = req.params;
    const updated = await Stylist.update(id, req.body);

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

export async function deleteStylist(req, res) {
  try {
    const { id } = req.params;
    await Stylist.remove(id);

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
