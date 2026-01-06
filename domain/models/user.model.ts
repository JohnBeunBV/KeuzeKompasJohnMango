export type AuthMethod = "local" | "oauth";

export interface OAuthInfo {
  provider: "microsoft";
  providerId: string; // Microsoft user id (sub / oid)
}

export interface User {
  _id?: string;
  username: string;
  email: string;
  password?: string; // optional for OAuth users
  authMethod: AuthMethod;
  oauth?: OAuthInfo;
  roles: ("admin" | "teacher" | "student")[];
  favorites?: number[];
}
