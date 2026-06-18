import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";
import {
    MdOutlineDashboard,
    MdMenu,
    MdClose,
    MdLogout,
    MdOutlineCalendarMonth
} from "react-icons/md";
import { PiBarnLight } from "react-icons/pi";
import { TbWaveSawTool, TbSettings } from "react-icons/tb";
import { LuChartColumn } from "react-icons/lu";
import toast from "react-hot-toast";
import config from "../config";
import { isExpiringSoon, refreshAccessToken } from "../utils/tokens";
import { logout } from "../utils/logout";

const FARM_CALENDAR_URL = config.FARM_CALENDAR_URL;

const Sidebar = () => {

    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    // ============
    // FarmCalendar
    // ============
    // The calendar opens in a new tab against the backend SSO entry, which
    // authenticates via the httponly access_token cookie. If the token is fresh
    // we open straight away (synchronous = no popup blocker). If it's
    // expired/near-expiry we refresh FIRST (renewing the cookie in lockstep)
    // before navigating, so the SSO entry never gets a stale cookie and 401s.
    const handleSync = async () => {
        const token = localStorage.getItem("access_token");

        if (token && !isExpiringSoon(token)) {
            window.open(FARM_CALENDAR_URL, "_blank");
            return;
        }

        // Open a blank tab synchronously (still within the click gesture) so the
        // popup blocker allows it, then point it at the calendar once refreshed.
        const tab = window.open("", "_blank");
        const ok = await refreshAccessToken();
        if (ok && tab) {
            tab.location.href = FARM_CALENDAR_URL;
        } else {
            if (tab) tab.close();
            toast.error("Your session has expired. Please log in again.");
            logout();
        }
    };

    const menuItems = [
        { id: "dashboard", label: t("sidebar.dashboard"), path: "/dashboard", icon: <MdOutlineDashboard size={20} /> },
        { id: "feeding", label: t("sidebar.feeding_management"), path: "/feeding-management", icon: <PiBarnLight size={20} /> },
        { id: "farm_calendar", label: t("sidebar.farm_calendar"), onClick: handleSync, icon: <MdOutlineCalendarMonth size={20} /> },
        { id: "animals", label: t("sidebar.animals"), path: "/animals", icon: <TbWaveSawTool size={20} /> },
        { id: "setup", label: t("sidebar.setup"), path: "/setup", icon: <TbSettings size={20} /> },
        { id: "analysis", label: t("sidebar.analysis"), path: "/analysis", icon: <LuChartColumn size={20} /> }
    ];

    const handleLogout = () => {
        // 1. Token remove karein
        localStorage.removeItem("access_token");

        // 2. Success message
        toast.success("Logged out successfully");

        // 3. Redirect to login
        navigate("/login");
    };

    const handleLinkClick = () => {
        if (window.innerWidth < 1024) { // only close on mobile
            setIsOpen(false);
        }
    };

    return (
        <>
            {/* Hamburger Button for Mobile */}
            <button
                className="fixed top-1.5 right-5 z-50 p-2 rounded-md bg-white shadow-md lg:hidden"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
            </button>

            {/* Sidebar */}
            <aside
                className={`
                    fixed z-50 top-0 left-0 h-screen w-64 lg:w-full bg-white border-r border-gray-200 flex flex-col border-t
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full"} 
                    lg:translate-x-0 lg:static lg:block z-40
                `}
            >
                {/* Menu */}
                <nav className="flex-1 px-4 py-4">
                    <ul className="space-y-2">
                        {menuItems.map((item) => (
                            <li key={item.id}>
                                {item.path ? (
                                    <NavLink
                                        to={item.path}
                                        onClick={handleLinkClick}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-3 rounded-xl transition text-base font-normal
                                            ${isActive
                                                ? "bg-green-100 text-green-700"
                                                : "text-slate-600 hover:bg-slate-600 hover:text-white"
                                            }`
                                        }
                                    >
                                        {item.icon}
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </NavLink>
                                ) : (
                                    <button
                                        onClick={() => {
                                            item.onClick?.();
                                            handleLinkClick();
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition text-base font-normal text-slate-600 hover:bg-slate-600 hover:text-white w-full text-left cursor-pointer"
                                    >
                                        {item.icon}
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition text-base font-normal text-red-600 hover:bg-red-50 mt-auto cursor-pointer w-full"
                    >
                        <MdLogout size={20} />
                        <span className="text-sm font-medium">{t("sidebar.logout")}</span>
                    </button>
                </nav>
            </aside>

            {/* Overlay for mobile when sidebar is open */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-30 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default Sidebar;
