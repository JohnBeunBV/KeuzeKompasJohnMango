import { Router } from "express";
import { jwtAuth, requireUser } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/roles.middleware";
import * as teacherController from "./teacher.controller";

const router = Router();

router.use(jwtAuth, requireUser, requireRole("teacher"));

router.get("/students", teacherController.getStudents);

export default router;
