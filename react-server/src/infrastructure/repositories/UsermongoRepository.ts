import {UserModel} from "../modelsinf/userinf.model";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {User} from "../../domain/models/user.model";
import mongoose from "mongoose";

export class UserMongoRepository implements UserRepository {
    async getById(id: string): Promise<User | null> {
        const user = await UserModel.findById({_id: id}).lean();
        if (!user) return null;
        return {...user, _id: user._id.toString()};
    }

    async getByEmail(email: string): Promise<User | null> {
        const user = await UserModel.findOne({email: email}).lean();
        if (!user) return null;
        return {...user, _id: user._id.toString()};
    }

    async create(user: User): Promise<User> {
        const createdUser = await new UserModel(user).save();
        return {...createdUser.toObject(), _id: createdUser._id.toString()};
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

    async getByOAuth(provider: string, providerId: string): Promise<User | null> {
        const user = await UserModel.findOne({
            "oauth.provider": provider,
            "oauth.providerId": providerId
        }).lean();

        if (!user) return null;
        return {...user, _id: user._id.toString()};
    }


    async delete(id: string): Promise<void> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("Invalid ID");
        }

        await UserModel.findByIdAndDelete(id);
    }


    async addFavorite(userId: string, vkmId: number): Promise<User> {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error("User not found");
        if (!user.favorites) user.favorites = [];
        if (!user.favorites.includes(vkmId)) user.favorites.push(vkmId);
        await user.save();
        return {...user.toObject(), _id: user._id.toString()};
    }

    async removeFavorite(userId: string, vkmId: number): Promise<User> {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error("User not found");
        user.favorites = user.favorites?.filter((id: number) => id !== vkmId);
        await user.save();
        return {...user.toObject(), _id: user._id.toString()};
    }

    async getFavorites(userId: string): Promise<number[]> {
        const user = await UserModel.findById(userId).lean();
        if (!user) throw new Error("User not found");
        return user.favorites || [];
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