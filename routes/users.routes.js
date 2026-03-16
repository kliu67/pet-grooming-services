import express from "express";
import * as UserController from "../controllers/users.controller.js";

const userRoutes = express.Router();

userRoutes.get("/", UserController.getAllUsers);
userRoutes.get("/:id", UserController.getUserById);
userRoutes.post("/", UserController.createUser);

export default userRoutes;
