import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

const PrivateRoute = () => {
    // if not login then you redirect in login page
    return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;