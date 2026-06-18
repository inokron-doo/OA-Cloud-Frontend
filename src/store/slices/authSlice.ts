import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, User } from "../../interface/auth/auth";

const savedUser = localStorage.getItem("user");
const savedToken = localStorage.getItem("token");

interface ExtendedAuthState extends AuthState {
  signupLoading: boolean;
  loginLoading: boolean;
}

const initialState: ExtendedAuthState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
  loading: false, // can keep this if you use it globally
  signupLoading: false,
  loginLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // --- SIGNUP ---
    signupStart(state) {
      state.signupLoading = true;
      state.error = null;
    },
    signupSuccess(state) {
      state.signupLoading = false;
    },
    signupFailure(state, action: PayloadAction<string>) {
      state.signupLoading = false;
      state.error = action.payload;
    },

    // --- LOGIN ---
    loginStart(state) {
      state.loginLoading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.loginLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("token", action.payload.token);
    },
    loginFailure(state, action: PayloadAction<string | null>) {
      state.loginLoading = false;
      state.error = action.payload;
    },

    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
  },
});

export const {
  signupStart,
  signupFailure,
  signupSuccess,
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
} = authSlice.actions;

export default authSlice.reducer;