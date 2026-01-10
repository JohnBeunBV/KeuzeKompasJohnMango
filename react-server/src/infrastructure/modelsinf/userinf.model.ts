import {Schema, Document, model} from "mongoose";
import {User} from "../../domain/models/user.model";

export type UserDocument = User & Document;

const UserSchema = new Schema<UserDocument>({
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

    favorites: [
        {
            type: Schema.Types.ObjectId,
            ref: "Vkm",
        },
    ],
    profile: {
        interests: {type: [String], default: []},
        values: {type: [String], default: []},
        goals: {type: [String], default: []}
    }
});


export const UserModel = model<UserDocument>("User", UserSchema, "users");
