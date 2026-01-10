import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const requireRole = (role: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.auth?.roles?.includes(role)) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        next();
    };
};
