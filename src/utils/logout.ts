// utils/logout.ts
export const logout = () => {
  localStorage.clear();
  window.location.href = "/login";
};
