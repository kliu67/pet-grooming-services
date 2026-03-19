import express from "express";
import {
  bookAppointment,
  getAppointmentById,
  cancelAppointment,
  updateAppointment,
  getAllAppointments,
  deleteAppointment,
  getAppointmentsByStylistId,
  getUpcomingAppointmentsByStylistId,
} from "../controllers/appointments.controller.js";

const appointmentRoutes = express.Router();

appointmentRoutes.get("/", getAllAppointments)
appointmentRoutes.get("/stylist/:stylistId/upcoming", getUpcomingAppointmentsByStylistId);
appointmentRoutes.get("/stylist/:stylistId", getAppointmentsByStylistId);
appointmentRoutes.post("/", bookAppointment);
appointmentRoutes.get("/:id", getAppointmentById);
appointmentRoutes.patch("/:id/cancel", cancelAppointment);
appointmentRoutes.patch("/:id/update", updateAppointment);
appointmentRoutes.delete("/:id", deleteAppointment);

export default appointmentRoutes;
