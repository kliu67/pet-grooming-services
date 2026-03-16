import * as Service from "../models/services.model.js";

/**
 * GET /services
 */
export async function getAllServices(req, res) {
  try {
    const services = await Service.findAll();
    return res.status(200).json(services ?? []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /services/:id
 */
export async function getServiceById(req, res) {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    return res.status(200).json(service);
  } catch (err) {
    if (err.message.includes("validation")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /services
 */
export async function createService(req, res) {
  try {
    const { name, base_price, description } = req.body;
    const newService = await Service.create({ name, base_price, description });

    return res.status(201).json(newService);
  } catch (err) {
    if (err.message.includes("validation")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PUT /services/:id
 */
export async function updateService(req, res) {
  console.log("Incoming body:", req.body);
  try {
    const { id } = req.params;
    const { name, base_price, description } = req.body;

    const updated = await Service.update(id, { name, base_price, description });
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
 * DELETE /services/:id
 */
export async function deleteService(req, res) {
  try {
    const { id } = req.params;
    await Service.remove(id);

    return res.status(204).send(); // No content
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
