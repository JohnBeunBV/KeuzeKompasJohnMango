import { UserRepository } from "../../domain/repositories/UserRepository";
import { User } from "../../domain/models/user.model";
import { UserMongoRepository } from "../../infrastructure/repositories/UsermongoRepository";
import { VkmsMongoRepository } from "../../infrastructure/repositories/VkmsmongoRepository";
import { VkmsRepository } from "../../domain/repositories/VkmsRepository";
import { recommendWithAI } from "../../infrastructure/ai/ai.client";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import * as validator from "validator";

// Repositories
const userRepo: UserRepository = new UserMongoRepository();
const vkmRepo: VkmsRepository = new VkmsMongoRepository();

// Helper
const signUserToken = (user: User) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      type: "user",
      roles: ["user"],
      scopes: ["read:vkm"]
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "1h",
      issuer: "vkm-api",
      audience: "vkm-users"
    }
  );
};

// 🔹 Validatie functie (herbruikbaar voor register & update)
export const validateUserInput = (username?: string, email?: string, password?: string) => {
  if (username && username.length < 3) throw new Error("Gebruikersnaam moet minstens 3 tekens bevatten.");
  if (email && !validator.isEmail(email)) throw new Error("Ongeldig e-mailadres.");
  if (password) {
    const strongPassword = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!strongPassword.test(password)) throw new Error(
      "Wachtwoord moet minstens 8 tekens lang zijn, 1 hoofdletter en 1 symbool bevatten."
    );
  }
};

export const register = async (username: string, email: string, password: string) => {
  validateUserInput(username, email, password);

  const existingUser = await userRepo.getByEmail(email);
  if (existingUser) throw new Error("Email al in gebruik");

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser: User = { username, email, password: hashedPassword, favorites: [] };
  return userRepo.create(newUser);
};

export const login = async (email: string, password: string) => {
  const user = await userRepo.getByEmail(email);
  if (!user) throw new Error("User niet gevonden");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Ongeldige inloggegevens");

  const token = signUserToken(user);

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  };
};

export const getMe = async (userId: string) => {
  const user = await userRepo.getById(userId);
  if (!user) throw new Error("User niet gevonden");
  
  // Haal alle VKMs volledig op
  const favoriteVkms = await Promise.all(
    (user.favorites || [])
      .map(fav => typeof fav === "number" ? fav : fav.id)
      .map(id => vkmRepo.getById(id))
  );

  return { 
    ...user, 
    favorites: favoriteVkms.filter(v => v !== null)
  };
};

export const updateMe = async (userId: string, username?: string, email?: string, password?: string) => {
  validateUserInput(username, email, password); // 🔹 Validatie hier

  const updates: Partial<User> = {};
  if (username) updates.username = username;
  if (email) updates.email = email;
  if (password) updates.password = await bcrypt.hash(password, 10);

  const updatedUser = await userRepo.update(userId, updates);
  if (!updatedUser) throw new Error("User niet gevonden");
  return updatedUser;
};

export const deleteMe = async (userId: string) => {
  await userRepo.delete(userId);
};

export const addFavorite = async (userId: string, vkmId: number) => {
  const vkm = await vkmRepo.getById(vkmId);
  if (!vkm) throw new Error("VKM bestaat niet");

  const updatedUser = await userRepo.addFavorite(userId, vkmId);

  const favoriteVkms = await Promise.all(
    (updatedUser.favorites || [])
      .map(fav => typeof fav === "number" ? fav : fav.id)
      .map(id => vkmRepo.getById(id))
  );

  return { ...updatedUser, favorites: favoriteVkms.filter(v => v !== null) };
};

export const removeFavorite = async (userId: string, vkmId: number) => {
  const vkm = await vkmRepo.getById(vkmId);
  if (!vkm) throw new Error("VKM bestaat niet");

  const updatedUser = await userRepo.removeFavorite(userId, vkmId);

  const favoriteVkms = await Promise.all(
    (updatedUser.favorites || [])
      .map(fav => typeof fav === "number" ? fav : fav.id)
      .map(id => vkmRepo.getById(id))
  );

  return { ...updatedUser, favorites: favoriteVkms.filter(v => v !== null) };
};

export const getFavorites = async (userId: string) => {
  const user = await userRepo.getById(userId);
  if (!user) throw new Error("User not found");

  const favoriteVkms = await Promise.all(
    (user.favorites || [])
      .map(fav => typeof fav === "number" ? fav : fav.id)
      .map(id => vkmRepo.getById(id))
  );

  return favoriteVkms.filter(v => v !== null);
};

export const getRecommendations = async (userId: string) => {
  const user = await userRepo.getById(userId);
  
  // 1. Safety check: If no user or no favorites, return empty immediately
  // This prevents sending empty/invalid data to the AI model
  if (!user || !user.favorites || user.favorites.length === 0) {
    return [];
  }

  // 2. Extract IDs safely
  // Ensures we handle both [1, 2] and [{id:1}, {id:2}] formats
  const favoriteIds = user.favorites
    .map((fav) => (typeof fav === "number" ? fav : fav.id))
    .filter((id) => typeof id === "number" && !isNaN(id));

  // Double check we have IDs left
  if (favoriteIds.length === 0) return [];

  console.log("Sending to AI:", { favorite_id: favoriteIds});

  try {
    const aiResult = await recommendWithAI({
      user: {
        favorite_id: favoriteIds,
      },
      top_n: 5,
    });

    const vkms = await Promise.all(
      aiResult.recommendations.map(async (r: any) => {
        const vkm = await vkmRepo.getById(r.id);
        if (!vkm) return null;

        return {
          ...vkm,
          // Python sends 0.0-1.0 or 0-100?
          // If python sends 0.85, this makes it 85.
          // If python sends 85, this makes it 8500. Check your Python output! 
          // Assuming Python 0-1 based on your 'weights' dict:
          score: Math.round(r.score * 100), 
          explanation: r.explanation,
          details: r.details,
        };
      })
    );

    return vkms.filter(Boolean);
  } catch (err: any) {
    console.error("AI Service Error:", err.message);
    // Return empty array instead of crashing so frontend still loads
    return []; 
  }
};