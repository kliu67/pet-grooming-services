import express from "express";
import {
  getConfiguration,
  getConfigurationsByService,
  createConfiguration,
  updateConfiguration,
  deleteConfiguration,
} from "../controllers/serviceConfigurations.controller.js";

const serviceConfigrationRoutes = express.Router();

/* Get single configuration by composite key */
serviceConfigrationRoutes.get("/", getConfiguration);

/* List all configurations for a service */
serviceConfigrationRoutes.get("/service/:serviceId", getConfigurationsByService);

/* Create */
serviceConfigrationRoutes.post("/", createConfiguration);

/* Partial update */
serviceConfigrationRoutes.patch("/", updateConfiguration);

/* Delete */
serviceConfigrationRoutes.delete("/", deleteConfiguration);

export default serviceConfigrationRoutes;
