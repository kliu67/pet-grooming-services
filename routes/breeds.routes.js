import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getAllBreeds,
  getBreedById,
  createBreed,
  deleteBreed,
  updateBreed
} from "../controllers/breeds.controller.js";

const breedRoutes = express.Router();

breedRoutes.use(authMiddleware);

/* Get all breeds */
breedRoutes.get("/", getAllBreeds);

/* Get breed by id */
breedRoutes.get("/:id", getBreedById);

/* Create breed */
breedRoutes.post("/", createBreed);

/* Update breed */
breedRoutes.put("/:id", updateBreed);

/* Delete breed */
breedRoutes.delete("/:id", deleteBreed);

export default breedRoutes;
