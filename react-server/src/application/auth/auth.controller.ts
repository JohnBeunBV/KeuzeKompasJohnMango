import { Request, Response } from "express";
import * as authService from "./auth.service";
import { AuthRequest } from "../../middleware/auth.middleware";

// Helper
const getUserIdFromRequest = (req: AuthRequest): string => {
  if (!req.auth) {
    throw new Error("Unauthorized");
  }

  if (req.auth.type === "user") {
    return req.auth.id;
  }

  throw new Error("User context required");
};


export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ error: "Vul alle velden in." });

  try {
    const user = await authService.register(username, email, password);
    res.status(201).json({ message: "Registratie succesvol", user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const { token, user } = await authService.login(email, password);
    res.json({ token, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const loginMicrosoft = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "Missing idToken" });
  }

  try {
    const result = await authService.loginWithMicrosoft(idToken);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};


export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.getMe(getUserIdFromRequest(req));
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  const { username, email, password } = req.body;
  try {
    const updatedUser = await authService.updateMe(getUserIdFromRequest(req), username, email, password);
    res.json({ message: "Gegevens bijgewerkt!", user: updatedUser });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteMe = async (req: AuthRequest, res: Response) => {
  try {
    await authService.deleteMe(getUserIdFromRequest(req));
    res.json({ message: "Account verwijderd" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const addFavorite = async (req: AuthRequest, res: Response) => {
  const userId = getUserIdFromRequest(req);
  const vkmId = Number(req.params.vkmId);
  if (!vkmId) return res.status(400).json({ error: "VKM ID is required" });

  try {
    const updatedUser = await authService.addFavorite(userId, vkmId);
    res.json({ message: "VKM toegevoegd aan favorites", favorites: updatedUser.favorites });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const removeFavorite = async (req: AuthRequest, res: Response) => {
  const userId = getUserIdFromRequest(req);
  const vkmId = Number(req.params.vkmId);
  if (!vkmId) return res.status(400).json({ error: "VKM ID is required" });

  try {
    const updatedUser = await authService.removeFavorite(userId, vkmId);
    res.json({ message: "VKM verwijderd uit favorites", favorites: updatedUser.favorites });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const favorites = await authService.getFavorites(getUserIdFromRequest(req));
    res.json({ favorites });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getFavoritesByUserId = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  const favorites = await authService.getFavorites(userId);
  res.json(favorites);
};

export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const recommendations = await authService.getRecommendations(getUserIdFromRequest(req));
    res.json({ recommendations });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
