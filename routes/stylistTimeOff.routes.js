import express from "express";
import {
  getAllStylistTimeOff,
  getStylistTimeOffById,
  getStylistTimeOffByStylistId,
  createStylistTimeOff,
  updateStylistTimeOff,
  deleteStylistTimeOff,
} from "../controllers/stylistTimeOff.controller.js";

const stylistTimeOffRoutes = express.Router();

stylistTimeOffRoutes.get("/", getAllStylistTimeOff);
stylistTimeOffRoutes.get("/:id", getStylistTimeOffById);
stylistTimeOffRoutes.get("/stylist/:stylistId", getStylistTimeOffByStylistId);
stylistTimeOffRoutes.post("/", createStylistTimeOff);
stylistTimeOffRoutes.put("/:id", updateStylistTimeOff);
stylistTimeOffRoutes.delete("/:id", deleteStylistTimeOff);

export default stylistTimeOffRoutes;
