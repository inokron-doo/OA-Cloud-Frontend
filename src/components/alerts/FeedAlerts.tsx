import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from "react-i18next";
import { allFeedAlerts, deleteFeedAlerts } from '../../api/alert';
import type { Alert } from '../../interface/alerts';
import { CalendarClock, AlertTriangle, AlertCircle, Info, Clock, Thermometer, Trash2, HeartPulse, ClipboardX, TrendingDown, CalendarX, CloudSun } from 'lucide-react';
import OneTimeActivity from '../OneTimeActivity';
import DeleteModal from '../DeleteModal';
import { toast } from 'react-hot-toast';

interface FeedAlertsProps {
    onCountUpdate?: (count: number) => void;
    farmId?: string | null;
    barnId?: string | null;
}

const getSeverityStyles = (severity: string) => {
    switch (severity) {
        case 'critical':
            return 'bg-red-50 border-red-200 text-red-700';
        case 'warning':
            return 'bg-amber-50 border-amber-200 text-amber-700';
        default:
            return 'bg-blue-50 border-blue-200 text-blue-700';
    }
};

const getAlertIcon = (type: string, severity: string) => {
    const size = 20;
    switch (type) {
        case 'missed_feeding':
            return <ClipboardX size={size} />;
        case 'unexpected_feeding':
            return <AlertTriangle size={size} />;
        case 'health_spike':
            return <HeartPulse size={size} />;
        case 'spoilage_risk':
            return <Trash2 size={size} />;
        case 'low_feed':
        case 'low_feed_recurring':
            return <TrendingDown size={size} />;
        case 'heat_stress':
            return <Thermometer size={size} />;
        case 'cancel_feeding_suggestion':
            return <CalendarX size={size} />;
        default:
            return severity === 'critical' ? <AlertCircle size={size} /> : <Info size={size} />;
    }
};

// Hours until a future ISO timestamp (null if unparseable).
const leadHours = (iso: string | null): number | null => {
    if (!iso) return null;
    const diffMs = new Date(iso).getTime() - Date.now();
    if (Number.isNaN(diffMs)) return null;
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
};

// Absolute predicted time in the viewer's LOCAL timezone, e.g. "Wed 18:36".
const localTime = (iso: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatCreated = (iso: string): string => {
    const date = new Date(iso);
    const diffHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    const datePart = date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' });
    const timePart = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const fullStr = `${datePart} ${timePart}`;
    if (diffHours >= 24) return `${fullStr} • ${Math.floor(diffHours / 24)}d ago`;
    return fullStr;
};

const FeedAlerts: React.FC<FeedAlertsProps> = ({ onCountUpdate, barnId }) => {
    const { t } = useTranslation();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const fetchAlerts = async () => {
        try {
            const data = await allFeedAlerts("all");
            setAlerts(data.alerts);
        } catch (error) {
            console.error("Error fetching alerts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 2 * 60 * 1000); // 2 minutes
        return () => clearInterval(interval);
    }, []);

    const filteredAlerts = useMemo(
        () => alerts.filter(alert => !barnId || alert.barn_id === barnId),
        [alerts, barnId],
    );

    const observed = useMemo(() => filteredAlerts.filter(a => a.origin !== 'predicted'), [filteredAlerts]);
    const predicted = useMemo(
        () => filteredAlerts
            .filter(a => a.origin === 'predicted')
            .sort((a, b) => new Date(a.predicted_for || 0).getTime() - new Date(b.predicted_for || 0).getTime()),
        [filteredAlerts],
    );

    useEffect(() => {
        onCountUpdate?.(filteredAlerts.length);
    }, [filteredAlerts.length, onCountUpdate]);

    const handleDeleteAllAlerts = async () => {
        setIsDeleting(true);
        try {
            await deleteFeedAlerts();
            setIsDeleteModalOpen(false);
            toast.success(t('dashboardPage.remove_success'));
            fetchAlerts();
        } catch (error) {
            console.error("Error deleting all alerts:", error);
            toast.error(t('dashboardPage.remove_fail'));
        } finally {
            setIsDeleting(false);
        }
    };

    const renderCard = (alert: Alert, isPredicted: boolean) => (
        <div
            key={alert.alert_id}
            className={`p-4 rounded-xl border relative transition-all hover:shadow-md ${getSeverityStyles(alert.severity)} ${isPredicted ? 'border-dashed' : ''}`}
        >
            {!isPredicted && (
                <button
                    onClick={() => {
                        setSelectedAlert(alert);
                        setIsModalOpen(true);
                    }}
                    className="absolute top-4 right-3 text-gray-400 cursor-pointer hover:text-gray-600"
                    title={t('dashboardPage.schedule_action')}
                >
                    <CalendarClock size={18} />
                </button>
            )}

            <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/40">
                    {getAlertIcon(alert.alert_type, alert.severity)}
                </div>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                            {t(`alertTypes.${alert.alert_type}`, alert.alert_type.replace(/_/g, ' '))}
                            {isPredicted && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/70 text-[9px] tracking-normal">
                                    <CloudSun size={10} /> {t('dashboardPage.forecast')}
                                </span>
                            )}
                        </span>
                        <p className="font-semibold text-sm mt-0.5">
                            {alert.alert_data.message || `${t('dashboardPage.issue_detected')}${alert.barn_name || t('dashboardPage.unknown_barn')}`}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {isPredicted && alert.predicted_for && (() => {
                            const h = leadHours(alert.predicted_for);
                            const lead = h === null ? ''
                                : h <= 0 ? t('dashboardPage.lead_imminent', 'imminent')
                                : h >= 48 ? t('dashboardPage.lead_days', { defaultValue: 'in ~{{n}}d', n: Math.round(h / 24) })
                                : t('dashboardPage.lead_hours', { defaultValue: 'in ~{{n}}h', n: h });
                            return (
                                <>
                                    <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white/70 border border-current/10">
                                        {lead}
                                    </span>
                                    <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-white/60 border border-current/5 flex items-center gap-1.5">
                                        <Clock size={12} className="opacity-70" />
                                        {localTime(alert.predicted_for)}
                                    </span>
                                </>
                            );
                        })()}
                        {alert.alert_data.suspected_cause?.map(cause => (
                            <span key={cause} className="px-2 py-1 rounded-md text-[11px] font-medium bg-white/60 border border-current/5">
                                {t(`dashboardPage.cause_${cause}`, cause)}
                            </span>
                        ))}
                        {alert.barn_name && (
                            <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-white/60 border border-current/5">
                                {t('dashboardPage.barn')} {alert.barn_name}
                            </span>
                        )}
                        {alert.location_name && (
                            <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-white/60 border border-current/5">
                                {t('dashboardPage.location')} {alert.location_name}
                            </span>
                        )}
                        {!isPredicted && (
                            <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-white/60 border border-current/5 flex items-center gap-1.5 min-w-[80px] justify-center text-center">
                                <Clock size={12} className="opacity-70" />
                                {formatCreated(alert.created_at)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading && alerts.length === 0) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Now — observed / real-time */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{t('dashboardPage.now')}</h3>
                    {observed.length > 0 && (
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors font-medium border border-red-200 cursor-pointer"
                        >
                            {t('dashboardPage.remove_all')}
                        </button>
                    )}
                </div>
                {observed.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">{t('dashboardPage.no_active_alerts')}</p>
                ) : (
                    <div className="flex flex-col gap-3">{observed.map(a => renderCard(a, false))}</div>
                )}
            </div>

            {/* Upcoming — predicted */}
            {predicted.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{t('dashboardPage.upcoming')}</h3>
                    <div className="flex flex-col gap-3">{predicted.map(a => renderCard(a, true))}</div>
                </div>
            )}

            <OneTimeActivity
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedAlert(null);
                }}
                onSuccess={() => {
                    setIsModalOpen(false);
                    setSelectedAlert(null);
                    fetchAlerts();
                }}
                initialData={selectedAlert ? {
                    barn_id: selectedAlert.barn_id || selectedAlert.alert_data.barn_id,
                    feeding_location_id: selectedAlert.feeding_location_id || selectedAlert.alert_data.feeding_location_id || "",
                    schedule_name: "",
                    days_of_week: [],
                    time_start: "",
                    time_end: "",
                    quantity_kg: 0,
                    notes: ""
                } : null}
            />

            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteAllAlerts}
                title={t('dashboardPage.remove_all_title')}
                message={t('dashboardPage.remove_all_msg')}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default FeedAlerts;
