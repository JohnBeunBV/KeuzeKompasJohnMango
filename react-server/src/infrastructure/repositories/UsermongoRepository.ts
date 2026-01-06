import {UserModel} from "../modelsinf/userinf.model";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {User} from "../../domain/models/user.model";

export class UserMongoRepository implements UserRepository {

    async getById(id: string): Promise<User | null> {
        const user = await UserModel.findById(id).lean();
        if (!user) return null;
        return {...user, _id: user._id.toString()};
    }

    async getByEmail(email: string): Promise<User | null> {
        const user = await UserModel.findOne({email}).lean();
        if (!user) return null;
        return {...user, _id: user._id.toString()};
    }

    async create(user: User): Promise<User> {
        const createdUser = await new UserModel(user).save();
        return {...createdUser.toObject(), _id: createdUser._id.toString()};
    }

    async update(id: string, user: Partial<User>): Promise<User | null> {
        const updatedUser = await UserModel.findByIdAndUpdate(id, user, {new: true}).lean();
        if (!updatedUser) return null;
        return {...updatedUser, _id: updatedUser._id.toString()};
    }

    async delete(id: string): Promise<void> {
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

    async getByOAuth(provider: string, providerId: string): Promise<User | null> {
        const user = await UserModel.findOne({
            "oauth.provider": provider,
            "oauth.providerId": providerId
        }).lean();

        if (!user) return null;
        return {...user, _id: user._id.toString()};
    }


}


