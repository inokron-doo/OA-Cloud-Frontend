import { useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { GoAlert } from "react-icons/go";

// API & Interfaces
import { useBarn } from "../../context/BarnContext";
import type { WSAlert, NotificationData } from "../../interface/Notification";

// Components
const FeedAlerts = lazy(() => import("../alerts/FeedAlerts"));
const NotificationCard = lazy(() => import("../Notification"));
const ScheduleModal = lazy(() => import("../ScheduleModal"));

const AlertsSection = () => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ---------------------
    // ALERTS & NOTIFICATIONS STATES
    // ---------------------
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [feedAlertsCount, setFeedAlertsCount] = useState<number>(0);
    const [selectedAlertDetails, setSelectedAlertDetails] = useState<WSAlert | null>(null);

    const { selectedBarn } = useBarn();
    const notifBarnId = selectedBarn?.barn_id || null;
    const notifFarmId = localStorage.getItem("selected_farm_id");

    const handleScheduleClick = (details: WSAlert | undefined) => {
        setSelectedAlertDetails(details || null);
        setIsModalOpen(true);
    };

    const handleDismiss = (id: string) => {
        setNotifications((prev) => prev.filter(n => n.id !== id));
    };

    // Real-time + predicted alerts now flow through a single feed (FeedAlerts splits
    // them into Now/Upcoming); the count covers both plus any ws notifications.
    const totalAlertsCount = notifications.length + feedAlertsCount;

    return (
        <div className="w-full bg-white border-gray-200 border p-4 sm:p-5 mt-5 rounded-[14px]">
            {/* Header: title + count badge */}
            <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-gray-900 text-base font-normal">{t('dashboardPage.alerts_heading', 'Alerts & Notifications')}</h2>

                <div className="flex items-center gap-2 px-3 py-1 bg-[#FEF2F2] rounded-full text-[#C10007]">
                    <GoAlert size={16} />
                    <span className="text-xs sm:text-sm font-medium">{totalAlertsCount} {t('dashboardPage.alert_noti')}</span>
                </div>
            </div>

            {/* Alerts List (Now + Upcoming) */}
            <div className="space-y-4">
                <Suspense fallback={<div className="text-sm text-gray-400 py-2">Loading alerts...</div>}>
                    <FeedAlerts
                        onCountUpdate={setFeedAlertsCount}
                        farmId={notifFarmId}
                        barnId={notifBarnId}
                    />
                </Suspense>

                {notifications.map((notif) => (
                    <NotificationCard
                        key={notif.id}
                        notification={notif}
                        onSchedule={() => handleScheduleClick(notif.details)}
                        onIgnore={() => handleDismiss(notif.id)}
                    />
                ))}
            </div>

            <ScheduleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={selectedAlertDetails}
            />
        </div>
    );
};

export default AlertsSection;
