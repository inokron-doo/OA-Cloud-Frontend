// utils/auth.ts
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("access_token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiry = payload.exp * 1000;

    if (Date.now() >= expiry) {
      localStorage.clear();
      return false;
    }

    return true;
  } catch (error) {
    localStorage.clear();
    return false;
  }
};
