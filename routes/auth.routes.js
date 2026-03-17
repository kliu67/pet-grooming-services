import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware, validateLogin} from "../middleware/auth.middleware.js";
const authRoutes = express.Router();

authRoutes.post("/login", validateLogin, authController.login);
<<<<<<< HEAD
authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/logout", authController.logout);
authRoutes.get("/me", authController.me);

=======
authRoutes.get("/me", authMiddleware, authController.me);
authRoutes.post("/logout", authMiddleware, authController.logout);
>>>>>>> 08bde42d39396a7bd834fbdf50ed97ab11ca932c


export default authRoutes;
