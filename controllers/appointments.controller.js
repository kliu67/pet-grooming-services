import * as Appointment from "../models/appointments.model.js";
import { sendAppointmentCreatedEmail } from "../services/appointmentEmail.service.js";

/**
 * GEt /service-configurations
 */

function formatAppointmentNumber(id) {
  return `APT-${String(id).padStart(8, "0")}`;
}

function shapeAppointment(row) {
  if (!row || typeof row !== "object") return row;

  // Only synthesize when this looks like a DB appointment row.
  if (
    row.appointment_number == null &&
    row.uuid &&
    Number.isInteger(row.id) &&
    row.id > 0
  ) {
    return {
      ...row,
      appointment_number: formatAppointmentNumber(row.id),
    };
  }

  return row;
}

function shapeAppointments(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(shapeAppointment);
}

export async function getAllAppointments(req, res) {
  try {
    const appointments = await Appointment.findAll();
    return res.status(200).json(shapeAppointments(appointments));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getUpcomingAppointmentsByStylistId(req, res) {
  try {
    const { stylistId } = req.params;
    const appointments = await Appointment.findUpcomingByStylistId(stylistId);
    return res.status(200).json(shapeAppointments(appointments));
  } catch (err) {
    if (err.message.includes("invalid")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function getAppointmentsByStylistId(req, res) {
  try {
    const { stylistId } = req.params;
    const appointments = await Appointment.findByStylistId(stylistId);
    return res.status(200).json(shapeAppointments(appointments));
  } catch (err) {
    if (err.message.includes("invalid")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

export async function bookAppointment(req, res) {
  try {
    const created = await Appointment.book(req.body);
    return res.status(201).json(shapeAppointment(created));
  } catch (err) {
    if (
      err.message.includes("invalid") ||
      err.message.includes("not found") ||
      err.message.includes("configuration") ||
      err.message.includes("does not belong") ||
      err.message.includes("not available") ||
      err.message.includes("permitted")
    ) {
      return res.status(400).json({ error: err.message });
    }

    if (err.message.includes("overlaps")) {
      return res.status(409).json({ error: err.message });
    }

    return res.status(500).json({ error: err.message });
  }
}

export async function bookAppointmentFromScratch(req, res) {
  try {
    const created = await Appointment.bookFromScratch(req.body);
    const shapedAppointment = shapeAppointment(created);

    try {
      await sendAppointmentCreatedEmail({
        to: req.body.email,
        customerName: `${req.body.first_name ?? ""} ${req.body.last_name ?? ""}`.trim(),
        petName: req.body.pet_name,
        serviceName:
          shapedAppointment.service_name ??
          shapedAppointment.service_name_snapshot,
        breedName:
          shapedAppointment.breed_name ?? shapedAppointment.breed_name_snapshot,
        startTime: shapedAppointment.start_time,
        appointmentNumber: shapedAppointment.appointment_number,
      });
    } catch (emailErr) {
      // Email errors should not fail booking success.
      console.error(
        "[email] Failed to send appointment booking email:",
        emailErr.message,
      );
    }

    return res.status(201).json(shapedAppointment);
  } catch (err) {
    if (
      err.message.includes("invalid") ||
      err.message.includes("not found") ||
      err.message.includes("configuration") ||
      err.message.includes("does not belong") ||
      err.message.includes("not available") ||
      err.message.includes("permitted")
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

    return res.status(200).json(shapeAppointment(appt));
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
    return res.status(200).json(shapeAppointment(cancelled));
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

    const updated = await Appointment.update(id, req.body);
    return res.status(200).json(shapeAppointment(updated));
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

export async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;
    await Appointment.remove(id);
    return res.sendStatus(204);
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
