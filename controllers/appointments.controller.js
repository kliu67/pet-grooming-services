import * as Appointment from "../models/appointments.model.js";

/**
 * POST /appointments
 * Book appointment
 */
export async function bookAppointment(req, res) {
  try {
    const created = await Appointment.book(req.body);
    return res.status(201).json(created);
  } catch (err) {
    if (
      err.message.includes("invalid") ||
      err.message.includes("not found") ||
      err.message.includes("configuration")
    ) {
      return res.status(400).json({ error: err.message });
    }

    if (err.message.includes("overlaps")) {
      return res.status(409).json({ error: err.message });
    }

    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /appointments/:id
 */
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

/**
 * PATCH /appointments/:id/cancel
 */
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

/**
 * PATCH /appointments/:id/reschedule
 */
export async function rescheduleAppointment(req, res) {
  try {
    const { id } = req.params;
    const { start_time } = req.body;

    const updated = await Appointment.reschedule(id, start_time);
    return res.status(200).json(updated);
  } catch (err) {
    if (err.message === "appointment not found") {
      return res.status(404).json({ error: err.message });
    }

    if (err.message.includes("invalid")) {
      return res.status(400).json({ error: err.message });
    }

    if (err.message.includes("overlaps")) {
      return res.status(409).json({ error: err.message });
    }

    return res.status(500).json({ error: err.message });
  }
}
