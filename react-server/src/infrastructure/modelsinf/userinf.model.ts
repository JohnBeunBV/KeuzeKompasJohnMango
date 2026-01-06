import mongoose from "mongoose";
import { User } from "../../domain/models/user.model";

export type UserDocument = User & mongoose.Document;

const UserSchema = new mongoose.Schema<UserDocument>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favorites: { type: [Number], default: [] },
  profile: {
    interests: { type: [String], default: [] },
    values: { type: [String], default: [] },
    goals: { type: [String], default: [] }
  }
});

export const UserModel = mongoose.model<UserDocument>("User", UserSchema, "users");
