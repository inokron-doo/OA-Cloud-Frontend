

export interface AuthResponse {
    success: boolean;
    message: string;
    user?: {
        id: string;
        username: string;
        email: string;
    }
}

export interface RegisterData {
    username?: string;
    email: string;
    password?: string;
}

export interface SignInData {
    email: string;
    username: string;
    password?: string;
}

export interface User {
  user?: string;
  id: number;
  username: string;
  email: string;
  token: string; // keep this if backend returns `token`
  access_token?: string; // optional if some APIs return `access_token`
}

export interface AuthState {
  token: string | null; // global token for API calls
  user: User | null; // can be null after logout
  loading: boolean;
  error: string | null;
}