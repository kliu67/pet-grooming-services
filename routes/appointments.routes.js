import express from "express";
import {
  bookAppointment,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
} from "../controllers/appointments.controller.js";

const appointmentRoutes = express.Router();

/* Book appointment */
appointmentRoutes.post("/", bookAppointment);

/* Get by id */
appointmentRoutes.get("/:id", getAppointmentById);

/* Cancel */
appointmentRoutes.patch("/:id/cancel", cancelAppointment);

/* Reschedule */
appointmentRoutes.patch("/:id/reschedule", rescheduleAppointment);

export default appointmentRoutes;
