import express from "express";
import * as UserController from "../controllers/users.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const userRoutes = express.Router();

userRoutes.post("/", UserController.createUser);
userRoutes.get("/", authMiddleware, UserController.getAllUsers);
userRoutes.get("/:id", authMiddleware, UserController.getUserById);

export default userRoutes;
