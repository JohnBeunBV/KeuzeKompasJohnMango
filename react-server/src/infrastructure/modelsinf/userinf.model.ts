import mongoose from "mongoose";
import {User} from "../../domain/models/user.model";

export type UserDocument = User & mongoose.Document;

const UserSchema = new mongoose.Schema<UserDocument>({
    username: {type: String, required: true, unique: true},

    email: {type: String, required: true, unique: true},

    password: {
        type: String,
        required: function () {
            return this.authMethod === "local";
        }
    },

    authMethod: {
        type: String,
        enum: ["local", "oauth"],
        required: true,
        default: "local"
    },

    oauth: {
        provider: {type: String},
        providerId: {type: String}
    },

    roles: {
        type: [String],
        default: ["student"]
    },

    favorites: {type: [Number], default: []}
});


export const UserModel = mongoose.model<UserDocument>("User", UserSchema, "users");
