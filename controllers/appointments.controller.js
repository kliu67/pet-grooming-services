import * as Appointment from "../models/appointments.model.js";

/**
 * GEt /service-configurations
 */

export async function getAllAppointments(req, res) {
  try {
    const appointments = await Appointment.findAll();
    return res.status(200).json(appointments ?? []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function bookAppointment(req, res) {
  try {
    const created = await Appointment.book(req.body);
    return res.status(201).json(created);
  } catch (err) {
    if (
      err.message.includes("invalid") ||
      err.message.includes("not found") ||
      err.message.includes("configuration") ||
      err.message.includes("does not belong") ||
      err.message.includes("not available")
    ) {
      return res.status(400).json({ error: err.message });
    }

    if (err.message.includes("overlaps")) {
      return res.status(409).json({ error: err.message });
    }

    return res.status(500).json({ error: err.message });
  }
}

export async function getAppointmentById(req, res) {
  try {
    const { id } = req.params;
    const appt = await Appointment.findById(id);

    if (!appt) {
      return res.status(404).json({ error: "appointment not found" });
    }

    return res.status(200).json(appt);
  } catch (err) {
    if (err.message.includes("invalid")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function cancelAppointment(req, res) {
  try {
    const { id } = req.params;
    const cancelled = await Appointment.cancel(id);
    return res.status(200).json(cancelled);
  } catch (err) {
    if (err.message === "appointment not found") {
      return res.status(404).json({ error: err.message });
    }

    if (err.message.includes("invalid")) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: err.message });
  }
}

export async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const { startTime } = req.body;

    const updated = await Appointment.update(id, startTime);
    return res.status(200).json(updated);
  } catch (err) {
    if (err.message === "appointment not found") {
      return res.status(404).json({ error: err.message });
    }

    if (err.message.includes("invalid")) {
      return res.status(400).json({ error: err.message });
    }

    if (
      err.message.includes("overlaps") ||
      err.message.includes("not available")
    ) {
      return res.status(409).json({ error: err.message });
    }

    return res.status(500).json({ error: err.message });
  }
}
