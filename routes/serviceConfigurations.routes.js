import express from "express";
import {
  getConfiguration,
  getAllConfigurations,
  getConfigurationsByService,
  getConfigurationsByServiceGroupedByWeightClass,
  createConfiguration,
  updateConfiguration,
  deleteConfiguration,
} from "../controllers/serviceConfigurations.controller.js";

const serviceConfigrationRoutes = express.Router();

/* Get single configuration by composite key or list all configurations */
serviceConfigrationRoutes.get("/", (req, res) => {
  const { service_id, weight_class_id } = req.query;
  const hasCompositeQuery =
    service_id !== undefined ||
    weight_class_id !== undefined;

  if (hasCompositeQuery) {
    return getConfiguration(req, res);
  }

  return getAllConfigurations(req, res);
});

/* List all configurations for a service */
serviceConfigrationRoutes.get("/service/:serviceId", getConfigurationsByService);

/* List all configurations for a service grouped by weight class */
serviceConfigrationRoutes.get(
  "/service/:serviceId/grouped-by-weight-class",
  getConfigurationsByServiceGroupedByWeightClass
);

/* Create */
serviceConfigrationRoutes.post("/", createConfiguration);

/* Partial update */
serviceConfigrationRoutes.patch("/", updateConfiguration);

/* Delete */
serviceConfigrationRoutes.delete("/", deleteConfiguration);

export default serviceConfigrationRoutes;
