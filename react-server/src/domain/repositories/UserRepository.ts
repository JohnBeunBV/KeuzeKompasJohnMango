// domain/repositories/UserRepository.ts
import {User} from "../models/user.model";
import {Vkm} from "../models/vkm.model";


export interface UserRepository {
    getByOAuth(provider: string, providerId: string): Promise<User | null>;

    getById(id: string): Promise<User | null>;

    getByEmail(email: string): Promise<User | null>;

    create(user: User): Promise<User>;

    update(id: string, user: Partial<User>): Promise<User | null>;

    delete(id: string): Promise<void>;

    addFavorite(userId: string, vkmObjectId: string): Promise<User>;

    removeFavorite(userId: string, vkmObjectId: string): Promise<User>;

    getFavorites(userId: string): Promise<Vkm[]>;
}
