export interface StudentProfile {
  interests: string[];
  values: string[];
  goals: string[];
}

export interface User {
  _id?: string;
  username: string;
  email: string;
  password: string;
  token?: string;
  favorites?: number[];
  profile?: StudentProfile;
}
