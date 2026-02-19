import * as Config from "../models/serviceConfigurations.model.js";

/**
 * GET /service-configurations
 * Query params:
 *   ?species_id=&service_id=&weight_class_id=
 * → get single config by composite key
 */
export async function getConfiguration(req, res) {
  try {
    const { species_id, service_id, weight_class_id } = req.query;

    const config = await Config.findOne(
      species_id,
      service_id,
      weight_class_id
    );

    if (!config) {
      return res.status(404).json({ error: "configuration not found" });
    }

    return res.status(200).json(config);
  } catch (err) {
    if (err.message.includes("invalid")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /service-configurations/service/:serviceId
 * List all configs for a service (admin)
 */
export async function getConfigurationsByService(req, res) {
  try {
    const { serviceId } = req.params;
    const rows = await Config.findByService(serviceId);
    return res.status(200).json(rows);
  } catch (err) {
    if (err.message.includes("invalid")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /service-configurations
 */
export async function createConfiguration(req, res) {
  try {
    const created = await Config.create(req.body);
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
 * PATCH /service-configurations
 * Query params required:
 *   ?species_id=&service_id=&weight_class_id=
 */
export async function updateConfiguration(req, res) {
  try {
    const { species_id, service_id, weight_class_id } = req.query;
    const updates = req.body;

    const updated = await Config.update(
      species_id,
      service_id,
      weight_class_id,
      updates
    );

    return res.status(200).json(updated);
  } catch (err) {
    if (err.message === "configuration not found") {
      return res.status(404).json({ error: err.message });
    }

    if (err.message.includes("invalid") || err.message.includes("no")) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /service-configurations
 * Query params required:
 *   ?species_id=&service_id=&weight_class_id=
 */
export async function deleteConfiguration(req, res) {
  try {
    const { species_id, service_id, weight_class_id } = req.query;

    await Config.remove(species_id, service_id, weight_class_id);
    return res.status(204).send();
  } catch (err) {
    if (err.message === "configuration not found") {
      return res.status(404).json({ error: err.message });
    }

    if (err.message.includes("invalid")) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: err.message });
  }
}
