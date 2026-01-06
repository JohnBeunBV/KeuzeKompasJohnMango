import { Router } from "express";
import * as authController from "./auth.controller";
import {apiKeyAuth, requireScope, jwtAuth, requireUser } from "../../middleware/auth.middleware";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/login/oauth/microsoft", authController.loginMicrosoft);


router.get("/me", jwtAuth, requireUser, authController.getMe);
router.put("/me", jwtAuth, requireUser, authController.updateMe);
router.delete("/me", jwtAuth, requireUser, authController.deleteMe);
router.post("/users/favorites/:vkmId", jwtAuth, requireUser, authController.addFavorite);
router.delete("/users/favorites/:vkmId", jwtAuth, requireUser, authController.removeFavorite);
router.get("/me/favorites", jwtAuth, requireUser, authController.getFavorites);

router.get("/recommendations", jwtAuth, requireUser, authController.getRecommendations);

router.get(
  "/users/:userId/favorites",
  apiKeyAuth,
  requireScope("read:vkm"),
  authController.getFavoritesByUserId
);


export default router;

