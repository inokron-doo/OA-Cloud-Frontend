
import api from "./axios";
import type { RegisterData, SignInData } from "../interface/auth/auth";


// User Register
export const registerUser = async (data: RegisterData) => {
    const response = await api.post("/register/", data)
    // console.log(response, "Register Response");
    return response.data;
};

// User Login
export const loginUser = async (data: SignInData) => {
    const response = await api.post("/login/", data)
    // console.log(response, "Login Response");
    return response.data;
};

// User LogOut
export const logoutUser = async () => {
    const response = await api.post("/logout/")
    // console.log(response, "Logout Response");
    return response.data;
};

// Forgot Password
export const forgotPassword = async (data: { email: string }) => {
    const response = await api.post("/forgot-password/", data)
    // console.log(response, "Forgot Password Response");
    return response.data;
};

// Reset Password
export const resetPassword = async (data: { password: string }) => {
    const response = await api.post("/reset-password/", data)
    // console.log(response, "Reset Password Response");
    return response.data;
};

