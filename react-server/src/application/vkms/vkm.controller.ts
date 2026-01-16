import {Request, Response} from "express";
import {AuthRequest} from "../../middleware/auth.middleware";
import * as vkmService from "./vkm.service";
import { Types } from "mongoose";

// 🔹 Helper: escape regex tekens
function escapeRegex(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const getAllVkms = async (req: AuthRequest, res: Response) => {
    try {
        const isService =
            req.auth?.type === "service" &&
            req.auth.scopes?.includes("read:vkm");

        // Normal user pagination
        let page = Math.max(1, Number(req.query.page) || 1);
        let limit = Math.min(Number(req.query.limit) || 10, 100);

        // 🔑 SERVICE OVERRIDE
        if (isService) {
            page = 1;
            limit = Number.MAX_SAFE_INTEGER; // effectively "all"
        }

        const searchRaw = (req.query.search as string | undefined)?.trim();
        let search: string | undefined;

        if (searchRaw) {
            if (searchRaw.length > 100) {
                return res.status(400).json({error: "Search te lang (max 100 tekens)"});
            }
            search = escapeRegex(searchRaw);
        }

        const location = (req.query.location as string | undefined)?.trim();
        const credits = req.query.credits as string | undefined;

        const result = await vkmService.getAllVkms(
            page,
            limit,
            search,
            location,
            credits
        );
        res.json({
            vkms: result.vkms,
            meta: {
                total: result.total,
                serviceMode: isService
            }
        });
    } catch (err) {
        console.error("[Controller] Fout:", err);
        res.status(500).json({error: (err as Error).message});
    }
};



export const getVkmById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (Array.isArray(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Ongeldige VKM ID" });
        }

        const vkm = await vkmService.getVkmById(id);

        if (!vkm) {
            return res.status(404).json({ message: "Geen VKM gevonden voor ID: " + id });
        }

        res.json(vkm);
    } catch (err) {
        console.error("[VKM Controller] Fout:", err);
        res.status(500).json({ error: (err as Error).message });
    }
};



// Nieuwe controller functie voor swipe VKMs
export const getVkmsForSwipe = async (_req: Request, res: Response) => {
    try {
        const result = await vkmService.getAllVkms(1, 1000);
        res.json(result.vkms);
    } catch (err) {
        console.error("[Controller] Fout:", err);
        res.status(500).json({error: (err as Error).message});
    }
};

