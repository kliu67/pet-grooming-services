import * as Client from "../models/clients.model.js";
import { isValidEmail } from "../utils/helpers.js";
import { isValidPhone } from "../validators/client.validator.js";

/**
 * GET /clients
 */
export async function getAllClients(req, res, next) {
  try {
    const clients = await Client.findAll();
    res.json(clients);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /clients/:id
 */
export async function getClientById(req, res, next) {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: "invalid id" });
  }

  try {
    const client = await Client.findById(id);
    if (!client) return res.status(404).json({ error: "Client not found" });

    res.json(client);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /clients
 */
export async function createClient(req, res, next) {
  const { first_name, last_name, phone, email } = req.body;

  if (!first_name || !last_name || !phone) {
    return res.status(400).json({
      error: "first_name, last_name and phone are required",
    });
  }

  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: "invalid email format" });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: "invalid phone format" });
  }

  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (err) {
    if (err.message?.includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * PUT /clients/:id
 */
export async function updateClient(req, res, next) {
  const { id } = req.params;
  const { first_name, last_name, phone, email, description } = req.body;

  if (!first_name && !last_name && !email && !phone && !description) {
    return res.status(400).json({
      error:
        "At least one field required: first_name, last_name, phone, email, description",
    });
  }

  if (email !== undefined && email !== null && email !== '' && !isValidEmail(email)) {
    return res.status(400).json({ error: "invalid email format" });
  }

  if (phone !== undefined && phone !== null && !isValidPhone(phone)) {
    return res.status(400).json({ error: "invalid phone format" });
  }

  try {
    const client = await Client.update(id, req.body);
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  } catch (err) {
    if (err.message === "invalid id") {
      return res.status(400).json({ error: "invalid id" });
    }
    if (err.message === "client not found") {
      return res.status(404).json({ error: "Client not found" });
    }
    if (err.message?.includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * DELETE /clients/:id
 */
export async function deleteClient(req, res, next) {
  const { id } = req.params;

  try {
    const ok = await Client.remove(id);
    if (!ok) return res.status(404).json({ error: "Client not found" });

    res.sendStatus(204);
  } catch (err) {
    if (err.message === "invalid id") {
      return res.status(400).json({ error: "invalid id" });
    }
    if (err.message === "client not found") {
      return res.status(404).json({ error: "Client not found" });
    }
    next(err);
  }
}
