import {Vkm} from "./vkm.model";

export type AuthMethod = "local" | "oauth";

export interface OAuthInfo {
    provider: "microsoft";
    providerId: string; // Microsoft user id (sub / oid)
}

export interface StudentProfile {
    interests: string[];
    values: string[];
    goals: string[];
}

import { Vkm } from "./vkm.model";
export interface User {
    _id?: string;
    username: string;
    email: string;
    password?: string; // optional for OAuth users
    authMethod: AuthMethod;
    oauth?: OAuthInfo;
    roles: ("admin" | "teacher" | "student")[];
    profile?: StudentProfile;
    favorites?: Vkm[];
}

export interface PublicUser {
    id: string;
    username: string;
    email: string;
    favorites: Vkm[];
    profile: {
        interests: string[];
        values: string[];
        goals: string[];
    };
}
export function toPublicUser(user: User): PublicUser {
    return {
        id: user._id!,
        username: user.username,
        email: user.email,
        favorites: user.favorites ?? [],
        profile: {
            interests: user.profile?.interests ?? [],
            values: user.profile?.values ?? [],
            goals: user.profile?.goals ?? []
        }
    };
}