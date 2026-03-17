import express from "express";
import {
  getAllStylists,
  getStylistById,
  createStylist,
  updateStylist,
  deleteStylist,
} from "../controllers/stylists.controller.js";

const stylistRoutes = express.Router();

stylistRoutes.get("/", getAllStylists);
stylistRoutes.get("/:id", getStylistById);
stylistRoutes.post("/", createStylist);
stylistRoutes.put("/:id", updateStylist);
stylistRoutes.delete("/:id", deleteStylist);

export default stylistRoutes;
