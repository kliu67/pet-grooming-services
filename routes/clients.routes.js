import express from "express";
import * as ClientController from "../controllers/clients.controller.js";

const clientRoutes = express.Router();

clientRoutes.get("/", ClientController.getAllClients);
clientRoutes.get("/:id", ClientController.getClientById);
clientRoutes.post("/", ClientController.createClient);
clientRoutes.put("/:id", ClientController.updateClient);
clientRoutes.delete("/:id", ClientController.deleteClient);

export default clientRoutes;