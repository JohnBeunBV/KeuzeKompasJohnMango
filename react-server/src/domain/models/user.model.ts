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
  password: string;
  token?: string;
  profile?: StudentProfile;
  favorites?: number[] | Vkm[];
}
