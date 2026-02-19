import express from "express";
import {
  getAllSpecies,
  getSpeciesById,
  createSpecies,
  deleteSpecies,
} from "../controllers/species.controller.js";

const speciesRoutes = express.Router();

/* Get all species */
speciesRoutes.get("/", getAllSpecies);

/* Get species by id */
speciesRoutes.get("/:id", getSpeciesById);

/* Create species */
speciesRoutes.post("/", createSpecies);

/* Delete species */
speciesRoutes.delete("/:id", deleteSpecies);

export default speciesRoutes;
