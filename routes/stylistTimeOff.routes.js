import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getAllStylistTimeOff,
  getStylistTimeOffById,
  getStylistTimeOffByStylistId,
  createStylistTimeOff,
  updateStylistTimeOff,
  deleteStylistTimeOff,
} from "../controllers/stylistTimeOff.controller.js";

const stylistTimeOffRoutes = express.Router();

stylistTimeOffRoutes.use(authMiddleware);

stylistTimeOffRoutes.get("/", getAllStylistTimeOff);
stylistTimeOffRoutes.get("/:id", getStylistTimeOffById);
stylistTimeOffRoutes.get("/stylist/:stylistId", getStylistTimeOffByStylistId);
stylistTimeOffRoutes.post("/", createStylistTimeOff);
stylistTimeOffRoutes.put("/:id", updateStylistTimeOff);
stylistTimeOffRoutes.delete("/:id", deleteStylistTimeOff);

export default stylistTimeOffRoutes;
