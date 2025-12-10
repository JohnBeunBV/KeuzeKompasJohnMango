import { Request, Response } from "express";
import * as authService from "./auth.service";
import { AuthRequest } from "../../middleware/auth.middleware";

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

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  const { username, email, password } = req.body;
  try {
    const updatedUser = await authService.updateMe(req.user!.id, username, email, password);
    res.json({ message: "Gegevens bijgewerkt!", user: updatedUser });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteMe = async (req: AuthRequest, res: Response) => {
  try {
    await authService.deleteMe(req.user!.id);
    res.json({ message: "Account verwijderd" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const addFavorite = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
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
  const userId = req.user!.id;
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
    const favorites = await authService.getFavorites(req.user!.id);
    res.json({ favorites });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const recommendations = await authService.getRecommendations(req.user!.id);
    res.json({ recommendations });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
