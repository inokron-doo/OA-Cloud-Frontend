import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";

import { getMooheroEvents, getAnimalsByCollarId, getStoredMooHeroEvents } from '../api/moohero';
import { Calendar, AlertCircle, Activity, ChevronDown, ChevronUp, History } from 'lucide-react';
import type { IAnimal } from '../interface/MooHero';

interface IMooheroEvent {
    id: number;
    // Best human-readable label we could resolve for the animal (name, then collar, then fallback).
    animalLabel: string;
    // Raw collar id kept so we can re-resolve against the animals list once it loads.
    collarId: string;
    ended_at: string;
    started_at: string;
    type: string;
}

function MooheroEvents({ passedMooheroId, collarIds, animals, windowDays = 30 }: { passedMooheroId?: number | null, collarIds?: string[], animals?: IAnimal[], windowDays?: number }) {
    const { t, i18n } = useTranslation();
    // const { selectedMooheroId } = useBarn();

    // Parse both clean ISO ("...T07:05:00+00:00") and the API's space form
    // ("2026-06-17 09:05:00 +0200"), returning epoch ms or NaN.
    const parseDate = (s?: string) => {
        if (!s) return NaN;
        const direct = new Date(s).getTime();
        if (!isNaN(direct)) return direct;
        const norm = String(s).replace(' ', 'T').replace(/\s*([+-]\d{2})(\d{2})$/, '$1:$2');
        return new Date(norm).getTime();
    };

    // Build a collar -> animal lookup so an event can show "Bessie" instead of a row id.
    const animalByCollar = new Map<string, IAnimal>();
    (animals || []).forEach(a => {
        if (a.moohero_collar_unique_id) animalByCollar.set(String(a.moohero_collar_unique_id), a);
    });

    // Resolve the friendliest label we can, degrading gracefully when an animal
    // hasn't been created locally or the collar isn't referenced.
    const resolveAnimalLabel = (collarId: string, rawName?: string) => {
        const matched = collarId ? animalByCollar.get(String(collarId)) : undefined;
        if (matched?.animal_name) return matched.animal_name;
        if (rawName && rawName !== 'Unknown') return rawName;
        if (collarId) return `${t("mooheroEvents.collar")} ${collarId}`;
        return t("mooheroEvents.unknown_animal");
    };

    // Window is driven by the page-level control so the feed, the table counts,
    // and the detail view always agree.
    const getTodayStr = () => new Date().toISOString().split('T')[0];
    const fromStrForDays = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d.toISOString().split('T')[0];
    };
    const fromDate = fromStrForDays(windowDays);
    const toDate = getTodayStr();

    const [events, setEvents] = useState<IMooheroEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // Stable primitive key so a freshly-mapped collarIds array reference doesn't refetch on every render.
    const collarKey = (collarIds || []).join(',');

    useEffect(() => {
        if (passedMooheroId || (collarIds && collarIds.length > 0)) {
            fetchEvents();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [passedMooheroId, windowDays, collarKey]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            let data;
            // Prefer the collar-scoped feed: it's about the animals on screen and
            // carries the local animal_name + collar. Fall back to farm-wide/stored.
            if (collarIds && collarIds.length > 0) {
                data = await getAnimalsByCollarId(collarIds, fromDate, toDate);
            } else if (passedMooheroId) {
                data = await getMooheroEvents(passedMooheroId.toString(), fromDate, toDate);
            } else {
                data = await getStoredMooHeroEvents(windowDays);
            }

            const rawEvents = data?.events || data || [];

            const mappedEvents = rawEvents.map((e: any) => {
                const collarId = String(
                    e.moohero_collar_unique_id ?? e.collar_unique_id ?? e.details?.raw_event?.collar_unique_id ?? e.animal?.moohero_collar_unique_id ?? ''
                );
                // Only the top-level animal_name is the linked local name; the nested
                // raw_event.animal.name is a numeric ear-tag we intentionally ignore.
                const localName = e.animal_name;
                return {
                    id: e.id || e.event_id || e._id || Math.random(),
                    collarId,
                    animalLabel: resolveAnimalLabel(collarId, localName),
                    started_at: e.details?.started_at || e.started_at || e.event_time || e.timestamp,
                    ended_at: e.details?.ended_at || e.ended_at || e.event_time || e.timestamp,
                    type: e.event_type || e.type || e.details?.source_type || 'Unknown'
                };
            });

            const sortedEvents = mappedEvents.sort((a: IMooheroEvent, b: IMooheroEvent) =>
                parseDate(b.started_at) - parseDate(a.started_at)
            );

            setEvents(sortedEvents);
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            setLoading(false);
        }
    };

    const getEventStyles = (type: string) => {
        switch (type) {
            case 'HeatEvent':
                return {
                    bg: 'bg-orange-50',
                    border: 'border-orange-100',
                    iconColor: 'text-orange-600',
                    label: t("mooheroEvents.heat_event"),
                    icon: <Activity className="w-5 h-5" />,
                    accent: 'bg-orange-600'
                };
            case 'HealthProblemEvent':
                return {
                    bg: 'bg-rose-50',
                    border: 'border-rose-100',
                    iconColor: 'text-rose-600',
                    label: t("mooheroEvents.health_case"),
                    icon: <AlertCircle className="w-5 h-5" />,
                    accent: 'bg-rose-600'
                };
            default:
                return {
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-100',
                    iconColor: 'text-emerald-600',
                    label: type.replace('Event', ''),
                    icon: <History className="w-5 h-5" />,
                    accent: 'bg-emerald-600'
                };
        }
    };

    const formatDate = (dateStr: string) => {
        const ms = parseDate(dateStr);
        if (isNaN(ms)) return '';
        return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        const ms = parseDate(dateStr);
        if (isNaN(ms)) return '';
        return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // "2 days ago" style label — easier to scan than an absolute date. Empty string if unparseable.
    const formatRelative = (dateStr: string) => {
        const then = parseDate(dateStr);
        if (isNaN(then)) return '';
        const diffSec = Math.round((then - Date.now()) / 1000);
        const abs = Math.abs(diffSec);
        const rel = new Intl.RelativeTimeFormat(i18n.language || undefined, { numeric: 'auto' });
        if (abs < 60) return rel.format(diffSec, 'second');
        if (abs < 3600) return rel.format(Math.round(diffSec / 60), 'minute');
        if (abs < 86400) return rel.format(Math.round(diffSec / 3600), 'hour');
        if (abs < 2592000) return rel.format(Math.round(diffSec / 86400), 'day');
        if (abs < 31536000) return rel.format(Math.round(diffSec / 2592000), 'month');
        return rel.format(Math.round(diffSec / 31536000), 'year');
    };

    // "6h 20m" style duration between start and end. Empty string when we can't compute one.
    const formatDuration = (start: string, end: string) => {
        const s = parseDate(start);
        const e = parseDate(end);
        if (isNaN(s) || isNaN(e) || e < s) return '';
        const mins = Math.round((e - s) / 60000);
        if (mins < 1) return '<1m';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    return (
        <div className="w-full">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100/50 rounded-lg">
                        <History className="w-6 h-6 text-emerald-700" />
                    </div>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-600">
                        {t("mooheroEvents.title")}
                    </h2>
                </div>

                {/* Window is controlled by the page-level selector; show it for context. */}
                <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{t("mooheroEvents.window", { days: windowDays })}</span>
                </div>
            </div>

            {/* Events List */}
            <div className="pr-2 mt-5">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-emerald-700 font-medium animate-pulse text-sm">{t("mooheroEvents.fetching")}</p>
                    </div>
                ) : events.length > 0 ? (
                    <div className="grid gap-3">
                        {events.map((event) => {
                            const styles = getEventStyles(event.type);
                            const isExpanded = expandedId === event.id;

                            return (
                                <div
                                    key={event.id}
                                    className={`group relative overflow-hidden transition-all duration-300 border ${isExpanded ? 'border-emerald-200 shadow-md ring-1 ring-emerald-50' : 'border-gray-100 hover:border-emerald-100 shadow-sm'} rounded-[14px] bg-white`}
                                >
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer select-none"
                                        onClick={() => setExpandedId(isExpanded ? null : event.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl ${styles.bg} ${styles.iconColor} shadow-inner`}>
                                                {styles.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                                                    {styles.label} · {event.animalLabel}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400 font-medium">
                                                    <span>{formatRelative(event.started_at)}</span>
                                                    {formatDuration(event.started_at, event.ended_at) && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                            <span>{t("mooheroEvents.lasted")} {formatDuration(event.started_at, event.ended_at)}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-5">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs font-bold text-gray-700">{formatDate(event.started_at)}</p>
                                                <p className="text-[10px] text-gray-400 font-semibold">{formatTime(event.started_at)}</p>
                                            </div>
                                            <div className={`p-1 rounded-full bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors`}>
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable details */}
                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-48' : 'max-h-0'}`}>
                                        <div className="px-5 pb-5 pt-2 border-t border-gray-50 flex flex-wrap gap-8 bg-gray-50/40">
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t("mooheroEvents.session_start")}</label>
                                                <p className="text-xs text-gray-700 font-semibold flex flex-col">
                                                    <span>{formatDate(event.started_at)}</span>
                                                    <span className="text-gray-400 italic font-normal">{formatTime(event.started_at)}</span>
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t("mooheroEvents.session_end")}</label>
                                                <p className="text-xs text-gray-700 font-semibold flex flex-col">
                                                    <span>{formatDate(event.ended_at)}</span>
                                                    <span className="text-gray-400 italic font-normal">{formatTime(event.ended_at)}</span>
                                                </p>
                                            </div>
                                            {/* <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Status</label>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                    <span className="text-xs text-emerald-700 font-bold">Logged</span>
                                                </div>
                                            </div> */}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                        <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
                            <History className="w-8 h-8 text-gray-300" />
                        </div>
                        <h4 className="text-gray-900 font-bold text-sm mb-1">{t("mooheroEvents.no_events")}</h4>
                        <p className="text-gray-400 text-xs max-w-[200px]">{t("mooheroEvents.no_events_desc")}</p>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E5E7EB;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #D1D5DB;
                }
            `}} />
        </div>
    );
}

export default MooheroEvents;