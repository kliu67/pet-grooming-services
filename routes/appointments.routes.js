import express from "express";
import {
  bookAppointment,
  getAppointmentById,
  cancelAppointment,
  updateAppointment,
  getAllAppointments
} from "../controllers/appointments.controller.js";

const appointmentRoutes = express.Router();

appointmentRoutes.get("/", getAllAppointments)
appointmentRoutes.post("/", bookAppointment);
appointmentRoutes.get("/:id", getAppointmentById);
appointmentRoutes.patch("/:id/cancel", cancelAppointment);
appointmentRoutes.patch("/:id/update", updateAppointment);

export default appointmentRoutes;
