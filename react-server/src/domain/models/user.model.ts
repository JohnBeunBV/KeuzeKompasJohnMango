import { Vkm } from "./vkm.model";

export interface User {
    _id?: string; // optioneel want bij creatie bestaat het nog niet
  username: string;
  email: string;
  token?: string;
  password: string;
  favorites?: number[] | Vkm[];
}
