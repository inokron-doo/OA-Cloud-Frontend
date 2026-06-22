import { useState, useEffect, useCallback, useMemo, lazy } from "react";
import { useTranslation } from "react-i18next";

import {
    LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Brush, ReferenceLine,
} from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Button = lazy(() => import("../components/Button"));
const SkeletonChart = lazy(() => import("../components/SkeletonChart"));
import AnalysisStats from "../components/analysis/AnalysisStats";
import type { StatCard } from "../components/analysis/AnalysisStats";
import MetricToggles from "../components/analysis/MetricToggles";
import ConsumptionChart from "../components/analysis/ConsumptionChart";

import { feedingHistory } from "../api/feed";
import { getLocationByBarn } from "../api/barns";
import { useBarn } from "../context/BarnContext";
import { parseUtc, parseLocalWallClock } from "../utils/time";

import { FiDownload, FiCalendar, FiMapPin } from "react-icons/fi";


// --- Metric configuration -------------------------------------------------
// `axis` decides which Y axis a line binds to: percentages on the left,
// temperature/THI on the right so the scales don't squash each other.
const METRICS = [
    { key: "feed_level", labelKey: "anaylsis.legend_feed_level", color: "#12B76A", axis: "pct" as const },
    { key: "temperature", labelKey: "anaylsis.legend_temp", color: "#F04438", axis: "temp" as const },
    { key: "humidity", labelKey: "anaylsis.legend_humidity", color: "#2E90FA", axis: "pct" as const },
    { key: "thi", labelKey: "anaylsis.legend_thi", color: "#F79009", axis: "temp" as const },
];

const COMPARE_PALETTE = [
    "#2970FF", "#12B76A", "#F04438", "#F79009",
    "#7A5AF8", "#EE46BC", "#16B364", "#475467",
];

interface Point {
    time: string;
    ts: number;
    locationName: string;
    feed_level: number | null;
    temperature: number | null;
    humidity: number | null;
    thi: number | null;
}

// --- Pure helpers ---------------------------------------------------------

/** Group raw readings into chart points (ascending by time), keeping a real epoch `ts`. */
function transformHistory(history: any, locName: string, hoursRequested: number): Point[] {
    if (!history?.readings) return [];
    const grouped = new Map<string, Point>();

    history.readings.forEach((reading: any) => {
        const ts = parseUtc(reading.time);
        // Display label in the viewer's local (farm) timezone.
        const d = new Date(ts);
        const pad = (n: number) => String(n).padStart(2, "0");
        const hhmm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
        const timeKey = hoursRequested > 24 ? `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hhmm}` : hhmm;

        if (!grouped.has(timeKey)) {
            grouped.set(timeKey, {
                time: timeKey,
                ts,
                locationName: locName,
                feed_level: null,
                temperature: null,
                humidity: null,
                thi: null,
            });
        }

        const entry = grouped.get(timeKey)!;
        if (reading.reading_kind === "feed_level_percentage" || reading.reading_type === "feed_level_percentage") {
            if (reading.numeric_value != null) entry.feed_level = parseFloat(reading.numeric_value.toFixed(2));
        }
        if (reading.temperature != null) entry.temperature = parseFloat(reading.temperature.toFixed(2));
        if (reading.humidity != null) entry.humidity = parseFloat(reading.humidity.toFixed(2));
        if (reading.raw?.thi != null) entry.thi = parseFloat(reading.raw.thi.toFixed(2));
        else if (reading.thi != null) entry.thi = parseFloat(reading.thi.toFixed(2));
    });

    return Array.from(grouped.values()).reverse();
}

interface Stats {
    current: number | null;
    min: number | null;
    max: number | null;
    avg: number | null;
    change: number | null;
}

function computeStats(points: Point[], key: keyof Point): Stats {
    const vals = points
        .map((p) => p[key] as number | null)
        .filter((v): v is number => v != null && !Number.isNaN(v));
    if (!vals.length) return { current: null, min: null, max: null, avg: null, change: null };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const current = vals[vals.length - 1];
    const first = vals[0];
    const change = first !== 0 ? ((current - first) / Math.abs(first)) * 100 : null;
    return { current, min, max, avg, change };
}

/** UTC-based label so consumption blocks line up with the main chart's UTC clock labels. */
function blockLabel(ts: number, hours: number): string {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const md = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (hours > 168) return md;
    if (hours > 24) return `${md} ${hh}h`;
    return `${hh}h`;
}

/** Signed feed-level change per time block, in %/hour. */
function computeConsumption(points: Point[], hours: number) {
    const pts = points.filter((p) => p.feed_level != null && !Number.isNaN(p.ts));
    if (pts.length < 2) return [] as { label: string; rate: number }[];

    const blockH = hours <= 24 ? 1 : hours <= 48 ? 3 : hours <= 168 ? 6 : 24;
    const blockMs = blockH * 3600 * 1000;

    const buckets = new Map<number, Point[]>();
    pts.forEach((p) => {
        const b = Math.floor(p.ts / blockMs);
        if (!buckets.has(b)) buckets.set(b, []);
        buckets.get(b)!.push(p);
    });

    return Array.from(buckets.keys())
        .sort((a, b) => a - b)
        .map((b) => {
            const arr = buckets.get(b)!;
            const first = arr[0];
            const last = arr[arr.length - 1];
            const dtH = (last.ts - first.ts) / 3600000;
            const rate = dtH > 0 ? (last.feed_level! - first.feed_level!) / dtH : 0;
            return { label: blockLabel(b * blockMs, hours), rate: parseFloat(rate.toFixed(2)) };
        });
}


function Analysis() {
    const { t } = useTranslation();
    const { selectedBarn } = useBarn();
    const barnId = selectedBarn?.barn_id || null;

    // --- Persisted view state ---
    const [locationId, setLocationId] = useState<string | null>(localStorage.getItem("selected_location_id"));
    const [rangeType, setRangeType] = useState<string>(localStorage.getItem("analysis_range_type") || "24");
    const [customStart, setCustomStart] = useState<string>("");
    const [customEnd, setCustomEnd] = useState<string>("");
    const [hoursRequested, setHoursRequested] = useState<number>(24);

    // --- Data ---
    const [locations, setLocations] = useState<any[]>([]);
    const [chartData, setChartData] = useState<Point[]>([]);
    const [feedingEvents, setFeedingEvents] = useState<any[]>([]);

    // --- Compare mode ---
    const [compareMode, setCompareMode] = useState(false);
    const [compareLocationIds, setCompareLocationIds] = useState<string[]>([]);
    const [compareMetric, setCompareMetric] = useState<string>("feed_level");
    const [compareSeries, setCompareSeries] = useState<{ id: string; name: string; color: string; points: Point[] }[]>([]);
    const [compareData, setCompareData] = useState<any[]>([]);

    // --- UI state ---
    const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(new Set(METRICS.map((m) => m.key)));
    const [showEvents, setShowEvents] = useState(true);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingLocs, setIsLoadingLocs] = useState(false);

    // Range selected via the chart's bottom brush; stats recompute over this slice.
    const [brush, setBrush] = useState<{ start?: number; end?: number }>({});

    // Resolve the active range into API params (hours OR start/end).
    const rangeParams = useCallback(() => {
        if (rangeType === "custom" && customStart && customEnd) {
            return { start: `${customStart}T00:00:00Z`, end: `${customEnd}T23:59:59Z` } as const;
        }
        return { hours: Number(rangeType) || 24 } as const;
    }, [rangeType, customStart, customEnd]);

    const customRangeInvalid =
        rangeType === "custom" && !!customStart && !!customEnd && customStart > customEnd;

    // Fetch locations for the selected barn.
    useEffect(() => {
        const fetchLocs = async () => {
            if (!barnId) { setLocations([]); return; }
            try {
                setIsLoadingLocs(true);
                const locData = await getLocationByBarn(barnId);
                setLocations(locData.feeding_locations || []);
            } catch {
                setLocations([]);
            } finally {
                setIsLoadingLocs(false);
            }
        };
        fetchLocs();
    }, [barnId]);

    // Keep hoursRequested in sync with the range (used for labels + block sizing + header).
    useEffect(() => {
        if (rangeType === "custom") {
            if (customStart && customEnd && !customRangeInvalid) {
                const s = new Date(`${customStart}T00:00:00Z`).getTime();
                const e = new Date(`${customEnd}T23:59:59Z`).getTime();
                setHoursRequested(Math.max(1, Math.round((e - s) / 3600000)));
            }
        } else {
            setHoursRequested(Number(rangeType));
        }
    }, [rangeType, customStart, customEnd, customRangeInvalid]);

    // Single-location fetch.
    const fetchHistoryData = useCallback(async () => {
        if (!locationId) { setChartData([]); setFeedingEvents([]); return; }
        if (rangeType === "custom" && (!customStart || !customEnd || customRangeInvalid)) return;

        setIsLoading(true);
        try {
            const p = rangeParams();
            const history = "hours" in p
                ? await feedingHistory(locationId, p.hours)
                : await feedingHistory(locationId, undefined, p.start, p.end);
            const locName = locations.find((l) => l.feeding_location_id === locationId)?.name || "Location";
            setChartData(transformHistory(history, locName, hoursRequested));
            setFeedingEvents(history?.feeding_events || []);
        } catch {
            setChartData([]);
            setFeedingEvents([]);
        } finally {
            setIsLoading(false);
        }
    }, [locationId, locations, hoursRequested, rangeType, customStart, customEnd, customRangeInvalid, rangeParams]);

    // Compare fetch (one metric across many locations).
    const fetchCompareData = useCallback(async () => {
        if (!compareLocationIds.length) { setCompareSeries([]); setCompareData([]); return; }
        if (rangeType === "custom" && (!customStart || !customEnd || customRangeInvalid)) return;

        setIsLoading(true);
        try {
            const p = rangeParams();
            const results = await Promise.all(
                compareLocationIds.map(async (id, i) => {
                    const name = locations.find((l) => l.feeding_location_id === id)?.name || "Location";
                    const history = "hours" in p
                        ? await feedingHistory(id, p.hours)
                        : await feedingHistory(id, undefined, p.start, p.end);
                    return {
                        id,
                        name,
                        color: COMPARE_PALETTE[i % COMPARE_PALETTE.length],
                        points: transformHistory(history, name, hoursRequested),
                    };
                })
            );
            setCompareSeries(results);

            const merged = new Map<string, any>();
            results.forEach((s) => {
                s.points.forEach((pt) => {
                    if (!merged.has(pt.time)) merged.set(pt.time, { time: pt.time, ts: pt.ts });
                    merged.get(pt.time)[s.id] = pt[compareMetric as keyof Point];
                });
            });
            setCompareData(Array.from(merged.values()).sort((a, b) => a.ts - b.ts));
        } catch {
            setCompareSeries([]);
            setCompareData([]);
        } finally {
            setIsLoading(false);
        }
    }, [compareLocationIds, locations, compareMetric, hoursRequested, rangeType, customStart, customEnd, customRangeInvalid, rangeParams]);

    useEffect(() => {
        if (compareMode) fetchCompareData();
        else fetchHistoryData();
    }, [compareMode, fetchCompareData, fetchHistoryData]);

    // Reset the brush whenever the underlying dataset changes (stale indices otherwise).
    useEffect(() => { setBrush({}); }, [chartData, compareData, compareMode]);

    // Active slice = brushed sub-range, or the full dataset when nothing is brushed.
    const activeChartData = useMemo(() => {
        if (brush.start == null || brush.end == null) return chartData;
        return chartData.slice(brush.start, brush.end + 1);
    }, [chartData, brush]);
    const activeCompareData = useMemo(() => {
        if (brush.start == null || brush.end == null) return compareData;
        return compareData.slice(brush.start, brush.end + 1);
    }, [compareData, brush]);

    // --- Derived: stat cards (over the active range) ---
    const statCards = useMemo<StatCard[]>(() => {
        if (compareMode) {
            const metric = METRICS.find((m) => m.key === compareMetric);
            const unit = metric?.key === "temperature" ? "°C" : metric?.axis === "pct" ? "%" : undefined;
            return compareSeries.map((s) => {
                const st = computeStats(activeCompareData as any[], s.id as any);
                return { label: s.name, color: s.color, min: st.min, max: st.max, avg: st.avg, unit };
            });
        }
        return METRICS.filter((m) => visibleMetrics.has(m.key)).map((m) => {
            const st = computeStats(activeChartData, m.key as keyof Point);
            return { label: t(m.labelKey), color: m.color, min: st.min, max: st.max, avg: st.avg };
        });
    }, [compareMode, compareSeries, compareMetric, activeChartData, activeCompareData, visibleMetrics, t]);

    // --- Derived: consumption (single mode only) ---
    const consumption = useMemo(
        () => (compareMode ? [] : computeConsumption(chartData, hoursRequested)),
        [compareMode, chartData, hoursRequested]
    );
    const avgConsumption = useMemo(() => {
        if (!consumption.length) return null;
        return consumption.reduce((a, b) => a + b.rate, 0) / consumption.length;
    }, [consumption]);

    // --- Derived: feeding-event markers (single mode only) ---
    const eventMarkers = useMemo(() => {
        if (compareMode || !showEvents || !feedingEvents.length || !chartData.length) return [];
        return feedingEvents
            .map((ev) => {
                const evTs = parseLocalWallClock(ev.timestamp || ev.start_datetime);
                if (Number.isNaN(evTs)) return null;
                let nearest = chartData[0];
                let best = Infinity;
                for (const p of chartData) {
                    const d = Math.abs(p.ts - evTs);
                    if (d < best) { best = d; nearest = p; }
                }
                return {
                    x: nearest.time,
                    kg: ev.feeding_activity?.quantity_kg ?? null,
                    title: ev.feeding_activity?.title || "",
                };
            })
            .filter(Boolean) as { x: string; kg: number | null; title: string }[];
    }, [compareMode, showEvents, feedingEvents, chartData]);

    // --- Derived: export rows ---
    const exportConfig = useMemo(() => {
        if (compareMode) {
            const headers = [t("anaylsis.pdf_time"), ...compareSeries.map((s) => s.name)];
            const rows = compareData.map((d) => [d.time, ...compareSeries.map((s) => d[s.id] ?? "-")]);
            return { headers, rows };
        }
        const visible = METRICS.filter((m) => visibleMetrics.has(m.key));
        const headers = [t("anaylsis.pdf_time"), ...visible.map((m) => t(m.labelKey))];
        const rows = chartData.map((d) => [d.time, ...visible.map((m) => (d as any)[m.key] ?? "-")]);
        return { headers, rows };
    }, [compareMode, compareSeries, compareData, chartData, visibleMetrics, t]);

    const hasData = compareMode ? compareData.length > 0 : chartData.length > 0;

    // --- Handlers ---
    const handleLocationChange = (id: string) => {
        setLocationId(id || null);
        if (id) localStorage.setItem("selected_location_id", id);
        else localStorage.removeItem("selected_location_id");
    };

    const handleRangeChange = (val: string) => {
        setRangeType(val);
        localStorage.setItem("analysis_range_type", val);
    };

    const toggleMetric = (key: string) => {
        setVisibleMetrics((prev) => {
            const next = new Set(prev);
            if (next.has(key)) { if (next.size > 1) next.delete(key); } // keep at least one
            else next.add(key);
            return next;
        });
    };

    const toggleCompareLocation = (id: string) => {
        setCompareLocationIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleExportPDF = () => {
        if (!exportConfig.rows.length) return;
        const doc = new jsPDF();
        const barnName = selectedBarn?.barn_name || "Barn";
        const subject = compareMode
            ? t(METRICS.find((m) => m.key === compareMetric)?.labelKey || "")
            : locations.find((l) => l.feeding_location_id === locationId)?.name || "Location";

        doc.setFontSize(18);
        doc.text(t("anaylsis.pdf_heading"), 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`${t("anaylsis.pdf_barn")}${barnName}`, 14, 32);
        doc.text(`${t("anaylsis.pdf_location")}${subject}`, 14, 38);
        doc.text(`${t("anaylsis.pdf_time_range")}${hoursRequested}h`, 14, 44);

        autoTable(doc, {
            startY: 55,
            head: [exportConfig.headers],
            body: exportConfig.rows,
            headStyles: { fillColor: [41, 112, 255] },
        });
        doc.save(`${barnName}_${subject}_Analysis.pdf`);
        setIsExportOpen(false);
    };

    const handleExportCSV = () => {
        if (!exportConfig.rows.length) return;
        const barnName = selectedBarn?.barn_name || "Barn";
        const subject = compareMode
            ? t(METRICS.find((m) => m.key === compareMetric)?.labelKey || "")
            : locations.find((l) => l.feeding_location_id === locationId)?.name || "Location";

        const csv = [
            exportConfig.headers.join(","),
            ...exportConfig.rows.map((r) => r.join(",")),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${barnName}_${subject}_Analysis.csv`;
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsExportOpen(false);
    };

    const compareMetricDef = METRICS.find((m) => m.key === compareMetric);
    const compareDomain: [number | string, number | string] =
        compareMetricDef?.axis === "pct" ? [0, 100] : ["auto", "auto"];

    return (
        <div className="mt-5 space-y-6">
            {/* Filter Section */}
            <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <h1 className="text-[17px] font-semibold text-[#101828]">{t("anaylsis.heading")}</h1>
                    {/* Mode toggle */}
                    <div className="inline-flex rounded-xl border border-[#D1D5DC] bg-gray-50 p-0.5">
                        <button
                            onClick={() => setCompareMode(false)}
                            className={`px-4 py-1.5 text-[13px] font-medium rounded-[10px] transition-all ${
                                !compareMode ? "bg-white text-[#101828] shadow-sm" : "text-[#667085]"
                            }`}
                        >
                            {t("anaylsis.mode_single")}
                        </button>
                        <button
                            onClick={() => setCompareMode(true)}
                            className={`px-4 py-1.5 text-[13px] font-medium rounded-[10px] transition-all ${
                                compareMode ? "bg-white text-[#101828] shadow-sm" : "text-[#667085]"
                            }`}
                        >
                            {t("anaylsis.mode_compare")}
                        </button>
                    </div>
                </div>

                {/* Location selection */}
                {!compareMode ? (
                    <div className="flex flex-wrap items-center gap-2 w-full mb-6">
                        <select
                            value={locationId || ""}
                            onChange={(e) => handleLocationChange(e.target.value)}
                            disabled={!barnId || isLoadingLocs}
                            className="px-3 py-2 text-sm rounded-xl border border-[#D1D5DC] bg-gray-50 text-[#101828] outline-none cursor-pointer disabled:opacity-50"
                        >
                            <option value="">{isLoadingLocs ? t("navbar.loading_location") : t("navbar.select_location")}</option>
                            {locations.map((loc) => (
                                <option key={loc.feeding_location_id} value={loc.feeding_location_id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="mb-6 space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-[#475467]">{t("anaylsis.compare_select_locations")}</label>
                            <div className="flex flex-wrap gap-2">
                                {locations.length === 0 && (
                                    <span className="text-[13px] text-[#98A2B3]">{t("navbar.select_location")}</span>
                                )}
                                {locations.map((loc) => {
                                    const on = compareLocationIds.includes(loc.feeding_location_id);
                                    return (
                                        <button
                                            key={loc.feeding_location_id}
                                            onClick={() => toggleCompareLocation(loc.feeding_location_id)}
                                            className={`px-3 py-1.5 rounded-full border text-[13px] font-medium transition-all ${
                                                on ? "bg-[#EFF4FF] border-[#2970FF] text-[#155EEF]" : "bg-gray-50 border-[#D1D5DC] text-[#667085]"
                                            }`}
                                        >
                                            {loc.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="space-y-1.5 max-w-xs">
                            <label className="text-[13px] font-medium text-[#475467]">{t("anaylsis.compare_select_metric")}</label>
                            <select
                                value={compareMetric}
                                onChange={(e) => setCompareMetric(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl border border-[#D1D5DC] bg-white text-[14.5px] text-[#101828] outline-none cursor-pointer"
                            >
                                {METRICS.map((m) => (
                                    <option key={m.key} value={m.key}>{t(m.labelKey)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Range + export */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[13px] font-medium text-[#475467]">{t("anaylsis.label_3")}</label>
                        <div className="flex gap-2 flex-wrap">
                            <div className="relative flex-1 min-w-[150px]">
                                <select
                                    value={rangeType}
                                    onChange={(e) => handleRangeChange(e.target.value)}
                                    className="w-full h-11 px-4 pr-10 rounded-xl border border-[#D1D5DC] bg-white text-[14.5px] text-[#101828] outline-none appearance-none cursor-pointer"
                                >
                                    <option value="1">{t("anaylsis.select_1h")}</option>
                                    <option value="6">{t("anaylsis.select_6h")}</option>
                                    <option value="12">{t("anaylsis.select_12h")}</option>
                                    <option value="24">{t("anaylsis.select_3_1")}</option>
                                    <option value="48">{t("anaylsis.select_3_2")}</option>
                                    <option value="168">{t("anaylsis.select_3_3")}</option>
                                    <option value="custom">{t("anaylsis.select_3_4")}</option>
                                </select>
                                <FiCalendar className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                            {rangeType === "custom" && (
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="date"
                                        value={customStart}
                                        max={customEnd || new Date().toISOString().split("T")[0]}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="h-11 px-3 rounded-xl border border-[#D1D5DC] bg-white text-[14px] text-[#101828] outline-none"
                                    />
                                    <span className="text-[#98A2B3] text-sm">–</span>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        min={customStart}
                                        max={new Date().toISOString().split("T")[0]}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="h-11 px-3 rounded-xl border border-[#D1D5DC] bg-white text-[14px] text-[#101828] outline-none"
                                    />
                                </div>
                            )}
                        </div>
                        {customRangeInvalid && (
                            <p className="text-[12px] text-[#F04438]">{t("anaylsis.range_invalid")}</p>
                        )}
                    </div>

                    <div className="md:col-span-1 md:col-start-4 relative">
                        <Button
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            disabled={isLoading || !hasData}
                            className="h-11 w-full bg-[#2970FF] hover:bg-[#155EEF] disabled:bg-gray-300 text-white rounded-xl font-medium text-[14.5px] flex items-center justify-center gap-2.5 transition-all"
                        >
                            <FiDownload size={18} />
                            {t("anaylsis.btn_1")}
                        </Button>
                        {isExportOpen && !isLoading && hasData && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 overflow-hidden">
                                <button
                                    onClick={handleExportPDF}
                                    className="w-full text-left px-4 py-3 text-sm text-[#101828] hover:bg-gray-50 transition-colors border-b border-[#E5E7EB]"
                                >
                                    {t("anaylsis.export_pdf")}
                                </button>
                                <button
                                    onClick={handleExportCSV}
                                    className="w-full text-left px-4 py-3 text-sm text-[#101828] hover:bg-gray-50 transition-colors"
                                >
                                    {t("anaylsis.export_csv")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stat cards */}
            {hasData && !isLoading && (
                <AnalysisStats
                    cards={statCards}
                    labels={{
                        min: t("anaylsis.stats_min"),
                        max: t("anaylsis.stats_max"),
                        avg: t("anaylsis.stats_avg"),
                    }}
                />
            )}

            {/* Chart Section */}
            <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6">
                <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-[16px] font-semibold text-[#101828]">
                            {compareMode ? t("anaylsis.compare_heading") : t("anaylsis.heading_2")}
                        </h2>
                        {!compareMode && locationId && (
                            <div className="flex items-center gap-1.5 text-[12px] text-[#667085]">
                                <FiMapPin size={12} />
                                {locations.find((l) => l.feeding_location_id === locationId)?.name}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {!compareMode && (
                            <>
                                <MetricToggles
                                    metrics={METRICS.map((m) => ({ key: m.key, label: t(m.labelKey), color: m.color }))}
                                    visible={visibleMetrics}
                                    onToggle={toggleMetric}
                                />
                                <label className="flex items-center gap-1.5 text-[12px] font-medium text-[#475467] cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={showEvents}
                                        onChange={(e) => setShowEvents(e.target.checked)}
                                        className="accent-[#12B76A]"
                                    />
                                    {t("anaylsis.show_feeding_events")}
                                </label>
                            </>
                        )}
                        <div className="flex items-center gap-2 text-[13px] font-medium text-[#667085] bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <FiCalendar size={14} /> {t("anaylsis.last")} {hoursRequested} {t("anaylsis.hours")}
                        </div>
                    </div>
                </div>

                <div className="h-112.5 w-full relative">
                    {isLoading && <div className="absolute inset-0 z-10"><SkeletonChart height="350px" showTitle={false} /></div>}

                    {(!barnId || (!compareMode && !locationId) || (compareMode && compareLocationIds.length === 0)) ? (
                        <div className="h-full flex flex-col items-center justify-center text-[#667085] border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                            <p className="text-[15px] font-medium">
                                {!barnId ? t("anaylsis.text_7") : compareMode ? t("anaylsis.compare_hint_select") : t("anaylsis.text_8")}
                            </p>
                            <p className="text-[13px]">{!barnId ? t("anaylsis.text_9") : t("anaylsis.text_10")}</p>
                        </div>
                    ) : hasData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            {compareMode ? (
                                <LineChart data={compareData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="2 2" vertical stroke="#F0F0F0" />
                                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#666" }} axisLine={{ stroke: "#666" }} />
                                    <YAxis domain={compareDomain} tick={{ fontSize: 11, fill: "#666" }} axisLine={{ stroke: "#666" }} />
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                                    <Legend verticalAlign="bottom" height={40} wrapperStyle={{ paddingTop: "16px" }} />
                                    {compareSeries.map((s) => (
                                        <Line key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={s.color}
                                            strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                                    ))}
                                    <Brush dataKey="time" height={22} stroke="#2970FF" travellerWidth={8}
                                        onChange={(e: any) => setBrush({ start: e.startIndex, end: e.endIndex })} />
                                </LineChart>
                            ) : (
                                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="2 2" vertical stroke="#F0F0F0" />
                                    <XAxis
                                        dataKey="time"
                                        axisLine={{ stroke: "#666" }}
                                        tick={(props: any) => {
                                            const { x, y, payload } = props;
                                            const parts = payload.value.split(" ");
                                            return (
                                                <g transform={`translate(${x},${y})`}>
                                                    <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={11}>
                                                        {parts.length > 1 ? parts[1] : parts[0]}
                                                    </text>
                                                    {parts.length > 1 && (
                                                        <text x={0} y={0} dy={30} textAnchor="middle" fill="#999" fontSize={10}>
                                                            {parts[0]}
                                                        </text>
                                                    )}
                                                </g>
                                            );
                                        }}
                                    />
                                    <YAxis yAxisId="pct" domain={[0, 100]} tick={{ fontSize: 11, fill: "#666" }} axisLine={{ stroke: "#666" }} />
                                    <YAxis yAxisId="temp" orientation="right" domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "#666" }} axisLine={{ stroke: "#666" }} />
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                                    <Legend verticalAlign="bottom" height={40} wrapperStyle={{ paddingTop: "16px" }} />

                                    {eventMarkers.map((m, i) => (
                                        <ReferenceLine
                                            key={`ev-${i}`}
                                            yAxisId="pct"
                                            x={m.x}
                                            stroke="#12B76A"
                                            strokeDasharray="3 3"
                                            label={m.kg != null ? { value: `+${m.kg}kg`, position: "top", fontSize: 10, fill: "#12B76A" } : undefined}
                                        />
                                    ))}

                                    {METRICS.map((m) =>
                                        visibleMetrics.has(m.key) ? (
                                            <Line key={m.key} yAxisId={m.axis} type="monotone" dataKey={m.key}
                                                name={t(m.labelKey)} stroke={m.color} strokeWidth={2}
                                                dot={{ r: 2 }} isAnimationActive={false} connectNulls />
                                        ) : null
                                    )}
                                    <Brush dataKey="time" height={22} stroke="#2970FF" travellerWidth={8}
                                        onChange={(e: any) => setBrush({ start: e.startIndex, end: e.endIndex })} />
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    ) : (
                        !isLoading && (
                            <div className="h-full flex flex-col items-center justify-center text-[#667085] border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                                <p className="text-[15px] font-medium">{t("anaylsis.text_5")}</p>
                                <p className="text-[13px]">{t("anaylsis.text_6")}</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Consumption panel (single mode) */}
            {!compareMode && locationId && (
                <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6">
                    <div className="flex items-start justify-between mb-6 flex-wrap gap-2">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-[16px] font-semibold text-[#101828]">{t("anaylsis.consumption_title")}</h2>
                            <p className="text-[12px] text-[#667085]">{t("anaylsis.consumption_subtitle")}</p>
                        </div>
                        {avgConsumption != null && (
                            <div className="text-[13px] font-medium text-[#667085] bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                {t("anaylsis.consumption_avg")} {avgConsumption.toFixed(2)} {t("anaylsis.consumption_unit")}
                            </div>
                        )}
                    </div>
                    <ConsumptionChart
                        data={consumption}
                        unit={t("anaylsis.consumption_unit")}
                        emptyText={t("anaylsis.consumption_empty")}
                    />
                </div>
            )}
        </div>
    );
}

export default Analysis;
