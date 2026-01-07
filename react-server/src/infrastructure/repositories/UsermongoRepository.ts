// infrastructure/repositories/UsermongoRepository.ts
import {UserModel} from "../modelsinf/userinf.model";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {User} from "../../domain/models/user.model";
import {Types} from "mongoose";

export class UserMongoRepository implements UserRepository {

    // Helper to convert Mongoose Doc to Domain User
    private mapToDomain(doc: any): User {
        const obj = doc.toObject ? doc.toObject() : doc;
        return {
            ...obj,
            _id: obj._id.toString(),
            // Ensure favorites is always an array
            favorites: obj.favorites || []
        };
    }

    async getById(id: string): Promise<User | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        const user = await UserModel.findById(id);
        if (!user) return null;
        return this.mapToDomain(user);
    }

    async getByEmail(email: string): Promise<User | null> {
        const user = await UserModel.findOne({email});
        if (!user) return null;
        return this.mapToDomain(user);
    }

    async create(user: User): Promise<User> {
        const createdUser = await new UserModel(user).save();
        return this.mapToDomain(createdUser);
    }

    async update(id: string, updates: Partial<User>): Promise<User | null> {
        const user = await UserModel.findById(id);
        if (!user) return null;

        // Merge updates, maar behoud bestaande nested objects zoals profile
        if (updates.profile) {
            user.profile = user.profile || {interests: [], values: [], goals: []};
            if (updates.profile.interests) user.profile.interests = updates.profile.interests;
            if (updates.profile.values) user.profile.values = updates.profile.values;
            if (updates.profile.goals) user.profile.goals = updates.profile.goals;
            delete updates.profile; // verwijder zodat we niet overschrijven
        }

        Object.assign(user, updates); // rest van de velden
        await user.save();

        return {...user.toObject(), _id: user._id.toString()};
    }


    async delete(id: string): Promise<void> {
        if (!Types.ObjectId.isValid(id)) return;
        await UserModel.findByIdAndDelete(id);
    }

    async addFavorite(userId: string, vkmId: number): Promise<User> {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error("User not found");

        // Initialize if undefined
        if (!user.favorites) {
            user.favorites = [];
        }

        // Strict type check to prevent 'includes' errors
        const favs = user.favorites as number[];

        if (!favs.includes(vkmId)) {
            favs.push(vkmId);
            user.favorites = favs; // Re-assign to ensure Mongoose detects change
            await user.save();
        }

        return this.mapToDomain(user);
    }

    async removeFavorite(userId: string, vkmId: number): Promise<User> {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error("User not found");

        if (user.favorites && user.favorites.length > 0) {
            const favs = user.favorites as number[];
            user.favorites = favs.filter((id) => id !== vkmId);
            await user.save();
        }

        return this.mapToDomain(user);
    }

    async getFavorites(userId: string): Promise<number[]> {
        const user = await UserModel.findById(userId).lean();
        if (!user) throw new Error("User not found");
        return (user.favorites as number[]) || [];
    }


    async updateProfile(userId: string, profile: {
        interests?: string[];
        values?: string[];
        goals?: string[]
    }): Promise<User> {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error("User not found");

        user.profile = user.profile || {interests: [], values: [], goals: []};

        if (profile.interests) user.profile.interests = profile.interests;
        if (profile.values) user.profile.values = profile.values;
        if (profile.goals) user.profile.goals = profile.goals;

        await user.save();
        return {...user.toObject(), _id: user._id.toString()};
    }

    async getProfile(userId: string): Promise<{ interests: string[]; values: string[]; goals: string[] }> {
        const user = await UserModel.findById(userId).lean();
        if (!user) throw new Error("User not found");
        return user.profile || {interests: [], values: [], goals: []};
    }
}