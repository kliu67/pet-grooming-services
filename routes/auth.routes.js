import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware, validateLogin} from "../middleware/auth.middleware.js";
const authRoutes = express.Router();

authRoutes.post("/login", validateLogin, authController.login);
authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/logout", authController.logout);


export default authRoutes;
