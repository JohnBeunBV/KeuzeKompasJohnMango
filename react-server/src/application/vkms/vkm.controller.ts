import { Request, Response } from "express";
import * as vkmService from "./vkm.service";

// 🔹 Helper: escape regex tekens
function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const getAllVkms = async (req: Request, res: Response) => {
  try {
    // pagina/limit met boundaries
    const page = Math.max(1, Number(req.query.page) || 1);
    let limit = Number(req.query.limit) || 10;
    limit = Math.min(limit, 100); // max 100 items per page

    // veilige search string
    const searchRaw = (req.query.search as string | undefined)?.trim();
    let search: string | undefined = undefined;
    if (searchRaw) {
      if (searchRaw.length > 100) {
        return res.status(400).json({ error: "Search te lang (max 100 tekens)" });
      }
      search = escapeRegex(searchRaw);
    }

    // overige filters
    const location = (req.query.location as string | undefined)?.trim();
    const credits = req.query.credits as string | undefined;

    const result = await vkmService.getAllVkms(page, limit, search, location, credits);
    res.json(result);
  } catch (err) {
    console.error("[Controller] Fout:", err);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getVkmById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Ongeldige VKM ID" });
    }

    const vkm = await vkmService.getVkmById(id);

    if (!vkm) {
      return res.status(404).json({ message: "Geen data gevonden voor ID: " + id });
    }

    res.json(vkm);
  } catch (err) {
    console.error("[Controller] Fout:", err);
    res.status(500).json({ error: (err as Error).message });
  }
};


// Nieuwe controller functie voor swipe VKMs
export const getVkmsForSwipe = async (_req: Request, res: Response) => {
  try {
    const result = await vkmService.getAllVkms(1, 1000);
    res.json(result.vkms);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

