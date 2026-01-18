import { Request, Response } from "express";
import { UserModel } from "../../infrastructure/modelsinf/userinf.model";

/**
 * GET /admin/users
 */
export const getAllUsers = async (_: Request, res: Response) => {
    const users = await UserModel.find({}, "username email roles").lean();
    res.json({ users });
};

/**
 * PUT /admin/users/:id/roles
 */
export const updateUserRoles = async (req: Request, res: Response) => {
    const { roles } = req.body;
    const updated = await UserModel.findByIdAndUpdate(
        { $eq: req.params.id},
        { roles },
        { new: true }
    ).lean();

    res.json({ user: updated });
};

/**
 * POST /admin/ai/retrain
 */
export const retrainModels = async (_: Request, res: Response) => {
    // placeholder – later call Python service
    res.json({ status: "retraining started" });
};

/**
 * GET /admin/ai/training-data
 */
export const getTrainingData = async (_: Request, res: Response) => {
    // placeholder
    res.json({ samples: [], size: 0 });
};
