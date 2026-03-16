import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/services.controller.js";

const serviceRoutes = express.Router();

serviceRoutes.use(authMiddleware);

serviceRoutes.get("/", getAllServices);
serviceRoutes.get("/:id", getServiceById);
serviceRoutes.post("/", createService);
serviceRoutes.put("/:id", updateService);
serviceRoutes.delete("/:id", deleteService);

export default serviceRoutes;
