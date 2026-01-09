import { Router } from "express";
import { jwtAuth, requireUser } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/roles.middleware";
import * as adminController from "./admin.controller";

const router = Router();

router.use(jwtAuth, requireUser, requireRole("admin"));

router.get("/users", adminController.getAllUsers);
router.put("/users/:id/roles", adminController.updateUserRoles);

router.post("/ai/retrain", adminController.retrainModels);
router.get("/ai/training-data", adminController.getTrainingData);

export default router;
