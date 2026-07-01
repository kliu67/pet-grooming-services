import express from "express";
import {
  getAllWeightClasses,
  getWeightClassById,
  createWeightClass,
  deleteWeightClass,
} from "../controllers/weightClasses.controller.js";

const weightClassRoutes = express.Router();

/* Get all weight classes */
weightClassRoutes.get("/", getAllWeightClasses);

/* Get by id */
weightClassRoutes.get("/:id", getWeightClassById);

/* Create */
weightClassRoutes.post("/", createWeightClass);

/* Delete */
weightClassRoutes.delete("/:id", deleteWeightClass);

export default weightClassRoutes;
