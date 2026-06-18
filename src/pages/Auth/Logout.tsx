import { resetFarmCalendarSession } from "../../utils/farmCalendarSession";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.clear();
        // 🔥 Clear farm-calendar session
        resetFarmCalendarSession();
        navigate("/login", { replace: true });
    }, [navigate]);

    return null;
};

export default Logout;
