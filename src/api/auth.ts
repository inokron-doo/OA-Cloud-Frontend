
import api from "./axios";
import type { SignInData } from "../interface/auth/auth";

export const loginUser = async (data: SignInData) => {
    const response = await api.post("/login/", data)
    return response.data;
};

export const logoutUser = async () => {
    const response = await api.post("/logout/")
    return response.data;
};

