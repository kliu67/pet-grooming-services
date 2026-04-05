import express from "express";
import { getAppointmentConfirmationByAppointmentId } from "../controllers/appointmentConfirmation.controller.js";

const appointmentConfirmationRoutes = express.Router();

appointmentConfirmationRoutes.get("/:appointmentId", getAppointmentConfirmationByAppointmentId);

export default appointmentConfirmationRoutes;
