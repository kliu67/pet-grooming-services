import express from "express";
import {
  getAllStylistTimeOff,
  getStylistTimeOffById,
  createStylistTimeOff,
  updateStylistTimeOff,
  deleteStylistTimeOff,
} from "../controllers/stylistTimeOff.controller.js";

const stylistTimeOffRoutes = express.Router();

stylistTimeOffRoutes.get("/", getAllStylistTimeOff);
stylistTimeOffRoutes.get("/:id", getStylistTimeOffById);
stylistTimeOffRoutes.post("/", createStylistTimeOff);
stylistTimeOffRoutes.put("/:id", updateStylistTimeOff);
stylistTimeOffRoutes.delete("/:id", deleteStylistTimeOff);

export default stylistTimeOffRoutes;
