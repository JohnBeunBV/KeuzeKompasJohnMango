// domain/repositories/UserRepository.ts
import { User } from "../models/user.model";

export interface UserRepository {
  getById(id: string): Promise<User | null>;
   getByEmail(email: string): Promise<User | null>; // ✅ nieuw
  create(user: User): Promise<User>;
  update(id: string, user: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<void>;
  addFavorite(userId: string, vkmId: number): Promise<User>;
  removeFavorite(userId: string, vkmId: number): Promise<User>;
  getFavorites(userId: string): Promise<number[]>; // ✅ nieuw
}
