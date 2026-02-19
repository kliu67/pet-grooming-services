import express from "express";
import {
  getPetsByOwner,
  getPetById,
  createPet,
  updatePet,
  deletePet,
} from "../controllers/pets.controller.js";

const petRoute = express.Router();

/* Get all pets for a user */
petRoute.get("/owner/:ownerId", getPetsByOwner);

/* Get pet by id */
petRoute.get("/:id", getPetById);

/* Create pet */
petRoute.post("/", createPet);

/* Update pet (partial) */
petRoute.patch("/:id", updatePet);

/* Delete pet */
petRoute.delete("/:id", deletePet);

export default petRoute;
