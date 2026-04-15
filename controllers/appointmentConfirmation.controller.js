import * as AppointmentConfirmation from "../models/appointmentConfirmation.model.js";

export async function getAppointmentConfirmationByAppointmentId(req, res) {
  try {
    const { appointmentId } = req.params;
    const confirmation =
      await AppointmentConfirmation.findByAppointmentId(appointmentId);

    if (!confirmation) {
      return res.status(404).json({ error: "appointment confirmation not found" });
    }

    return res.status(200).json(confirmation);
  } catch (err) {
    if (err.message.includes("validation") || err.message.includes("invalid")) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: err.message });
  }
}
