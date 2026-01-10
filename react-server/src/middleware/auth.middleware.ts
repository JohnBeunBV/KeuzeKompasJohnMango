import {Request, Response, NextFunction} from "express";
import * as jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export interface AuthContext {
    type: "user" | "service";
    id: string;
    roles?: string[];
    scopes?: string[];
}

export interface AuthRequest extends Request {
    auth?: AuthContext;
}


export const jwtAuth = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({error: "No token"});

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        req.auth = {
            type: "user",
            id: decoded.id,
            roles: decoded.roles, // e.g. ["user", "admin"]
            scopes: decoded.scopes
        };

        next();
    } catch {
        return res.status(401).json({error: "Invalid token"});
    }
};

if (!process.env.PYTHON_API_KEY) {
    throw new Error("Missing required API keys in environment");

}

const SERVICE_KEYS = {
    [process.env.PYTHON_API_KEY!]: {
        id: "python-service",
        scopes: ["read:vkm"]
    }
};

export const apiKeyAuth = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const apiKey = req.header("X-API-Key");
    if (!apiKey) return res.status(401).json({error: "Missing API key"});
    const service = SERVICE_KEYS[apiKey];
    if (!service) return res.status(401).json({error: "Invalid API key"});

    req.auth = {
        type: "service",
        id: service.id,
        scopes: service.scopes
    };

    next();
};

export const requireScope = (scope: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.auth?.scopes?.includes(scope)) {
            return res.status(403).json({error: "Forbidden"});
        }
        next();
    };
};

export const requireUser = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.auth?.type !== "user") {
        return res.status(403).json({error: "User access only"});
    }
    next();
};

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    // Prefer JWT if present
    if (req.headers.authorization) {
        return jwtAuth(req, res, next);
    }

    // Fallback to API key
    if (req.headers["x-api-key"]) {
        return apiKeyAuth(req, res, next);
    }

    return res.status(401).json({
        error: "Authentication required (JWT or API key)"
    });
};
