import { Router } from "express";
import * as authController from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/me", authMiddleware, authController.getMe);
router.put("/me", authMiddleware, authController.updateMe);
router.delete("/me", authMiddleware, authController.deleteMe);
router.post("/users/favorites/:vkmId", authMiddleware,authController.addFavorite);
router.delete("/users/favorites/:vkmId", authMiddleware, authController.removeFavorite);
router.get("/me/favorites", authMiddleware, authController.getFavorites);
router.get("/recommendations", authMiddleware, authController.getRecommendations);

export default router;
