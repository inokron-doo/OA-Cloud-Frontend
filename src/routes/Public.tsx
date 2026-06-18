import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

const PublicRoute = () => {
    // user loggedIn then redirect in dashboard page
    return isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;