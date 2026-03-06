import express from "express";
import {
  bookAppointment,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
  getAllAppointments
} from "../controllers/appointments.controller.js";

const appointmentRoutes = express.Router();

appointmentRoutes.get("/", getAllAppointments)
appointmentRoutes.post("/", bookAppointment);
appointmentRoutes.get("/:id", getAppointmentById);
appointmentRoutes.patch("/:id/cancel", cancelAppointment);
appointmentRoutes.patch("/:id/reschedule", rescheduleAppointment);

export default appointmentRoutes;
