import * as AppointmentConfirmationToken from "../models/appointmentConfirmationTokens.model.js";

export async function getAllAppointmentConfirmationTokens(req, res) {
  try {
    const rows = await AppointmentConfirmationToken.findAll();
    return res.status(200).json(rows ?? []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getAppointmentConfirmationTokenById(req, res) {
  try {
    const { id } = req.params;
    const row = await AppointmentConfirmationToken.findById(id);

    if (!row) {
      return res
        .status(404)
        .json({ error: "appointment confirmation token not found" });
    }

    return res.status(200).json(row);
  } catch (err) {
    if (err.message.includes("validation") || err.message.includes("ID")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function getAppointmentConfirmationTokensByAppointmentId(req, res) {
  try {
    const { appointmentId } = req.params;
    const rows =
      await AppointmentConfirmationToken.findByAppointmentId(appointmentId);
    return res.status(200).json(rows ?? []);
  } catch (err) {
    if (err.message.includes("validation") || err.message.includes("ID")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function createAppointmentConfirmationToken(req, res) {
  try {
    const { appointment_id, token_hash, expires_at, revoked_at } = req.body;
    const created = await AppointmentConfirmationToken.create({
      appointment_id,
      token_hash,
      expires_at,
      revoked_at,
    });

    return res.status(201).json(created);
  } catch (err) {
    if (err.message.includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    if (err.message.includes("validation") || err.message.includes("ID")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function updateAppointmentConfirmationToken(req, res) {
  try {
    const { id } = req.params;
    const updated = await AppointmentConfirmationToken.update(id, req.body);

    return res.status(200).json(updated);
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }
    if (err.message.includes("validation") || err.message.includes("ID")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteAppointmentConfirmationToken(req, res) {
  try {
    const { id } = req.params;
    await AppointmentConfirmationToken.remove(id);

    return res.status(204).send();
  } catch (err) {
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes("validation") || err.message.includes("ID")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}
