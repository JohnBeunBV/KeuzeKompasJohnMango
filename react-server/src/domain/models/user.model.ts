export interface User {
    _id?: string;
  username: string;
  email: string;
  token?: string;
  password: string;
  favorites?: number[];
}
