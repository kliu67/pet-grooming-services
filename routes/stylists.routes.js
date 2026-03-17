import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getAllStylists,
  getStylistById,
  createStylist,
  updateStylist,
  deleteStylist,
} from "../controllers/stylists.controller.js";

const stylistRoutes = express.Router();

stylistRoutes.use(authMiddleware);

stylistRoutes.get("/", getAllStylists);
stylistRoutes.get("/:id", getStylistById);
stylistRoutes.post("/", createStylist);
stylistRoutes.put("/:id", updateStylist);
stylistRoutes.delete("/:id", deleteStylist);

export default stylistRoutes;
