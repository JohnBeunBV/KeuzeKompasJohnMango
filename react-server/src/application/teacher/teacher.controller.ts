import { Request, Response } from "express";
import { UserModel } from "../../infrastructure/modelsinf/userinf.model";

export const getStudents = async (_: Request, res: Response) => {
    const students = await UserModel.find(
        { roles: "student" },
        "username email favorites"
    ).lean();

    res.json({ students });
};
