import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getAllStylistAvailability,
  getStylistAvailabilityById,
  getStylistAvailabilityByStylistId,
  createStylistAvailability,
  updateStylistAvailability,
  deleteStylistAvailability,
} from "../controllers/stylistAvailability.controller.js";

const stylistAvailabilityRoutes = express.Router();

stylistAvailabilityRoutes.use(authMiddleware);

stylistAvailabilityRoutes.get("/", getAllStylistAvailability);
stylistAvailabilityRoutes.get("/:id", getStylistAvailabilityById);
stylistAvailabilityRoutes.get("/stylist/:stylistId", getStylistAvailabilityByStylistId);
stylistAvailabilityRoutes.post("/", createStylistAvailability);
stylistAvailabilityRoutes.put("/:id", updateStylistAvailability);
stylistAvailabilityRoutes.delete("/:id", deleteStylistAvailability);

export default stylistAvailabilityRoutes;
