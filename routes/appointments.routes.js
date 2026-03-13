import express from "express";
import {
  bookAppointment,
  getAppointmentById,
  cancelAppointment,
  updateAppointment,
  getAllAppointments,
  deleteAppointment,
} from "../controllers/appointments.controller.js";

const appointmentRoutes = express.Router();

appointmentRoutes.get("/", getAllAppointments)
appointmentRoutes.post("/", bookAppointment);
appointmentRoutes.get("/:id", getAppointmentById);
appointmentRoutes.patch("/:id/cancel", cancelAppointment);
appointmentRoutes.patch("/:id/update", updateAppointment);
appointmentRoutes.delete("/:id", deleteAppointment);

export default appointmentRoutes;
