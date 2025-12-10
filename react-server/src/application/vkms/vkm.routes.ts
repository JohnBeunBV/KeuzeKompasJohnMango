import { Router } from "express";
import * as vkmController from "./vkm.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, vkmController.getAllVkms);
router.get("/:id", authMiddleware, vkmController.getVkmById);

export default router;
