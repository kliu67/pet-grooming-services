import express from "express";
import {
  getAllStylistAvailability,
  getStylistAvailabilityById,
  createStylistAvailability,
  updateStylistAvailability,
  deleteStylistAvailability,
} from "../controllers/stylistAvailability.controller.js";

const stylistAvailabilityRoutes = express.Router();

stylistAvailabilityRoutes.get("/", getAllStylistAvailability);
stylistAvailabilityRoutes.get("/:id", getStylistAvailabilityById);
stylistAvailabilityRoutes.post("/", createStylistAvailability);
stylistAvailabilityRoutes.put("/:id", updateStylistAvailability);
stylistAvailabilityRoutes.delete("/:id", deleteStylistAvailability);

export default stylistAvailabilityRoutes;
