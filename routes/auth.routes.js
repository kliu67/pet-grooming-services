import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware, validateLogin} from "../middleware/auth.middleware.js";
const authRoutes = express.Router();

authRoutes.post("/login", validateLogin, authController.login);
authRoutes.get("/me", authMiddleware, authController.me);
authRoutes.post("/logout", authMiddleware, authController.logout);


export default authRoutes;
