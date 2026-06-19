import { useState, useEffect, useCallback, lazy } from "react";

// API & Interfaces
import { weatherHistory, weatherForecast } from "../../api/barns";
import { useBarn } from "../../context/BarnContext";
import { getAnchorTime } from "../../api/anchorTime";

// Components
const CombinedClimateChart = lazy(() => import("../CombinedClimateChart"));

const ClimateSection = () => {
    const { selectedBarn: activeBarn } = useBarn();
    const climateBarnId = activeBarn?.barn_id || null;

    const [isClimateLoading, setIsClimateLoading] = useState(false);
    const [climateHistory, setClimateHistory] = useState<any[]>([]);

    // --- Anchor Time Domain ---
    const [anchorDomain, setAnchorDomain] = useState<[number, number]>([0, 0]);

    useEffect(() => {
        const loadAnchor = async () => {
            try {
                const { anchor_time } = await getAnchorTime();
                const [hStr, mStr, sStr] = anchor_time.split(":");
                const h = parseInt(hStr ?? "0", 10);
                const m = parseInt(mStr ?? "0", 10);
                const s = parseInt(sStr ?? "0", 10);

                const now = new Date();
                const anchor = new Date(now);
                anchor.setHours(h, m, s, 0);

                if (anchor.getTime() > now.getTime()) {
                    anchor.setDate(anchor.getDate() - 1);
                }

                const start = anchor.getTime();
                const end = start + 24 * 3600 * 1000;
                setAnchorDomain([start, end]);
            } catch {
                const now = Date.now();
                setAnchorDomain([now - 24 * 3600 * 1000, now]);
            }
        };
        loadAnchor();

        window.addEventListener("anchorTimeUpdated", loadAnchor);
        return () => window.removeEventListener("anchorTimeUpdated", loadAnchor);
    }, []);

    // --- Data Fetching: climate history + forecast for the chart ---
    // (Current conditions now live in the ClimateNow strip at the top.)

    const fetchWeatherHistory = useCallback(async () => {
        if (!climateBarnId || anchorDomain[0] === 0) return;

        try {
            setIsClimateLoading(true);
            setClimateHistory([]);

            const toNominalUTC = (ms: number) => {
                const d = new Date(ms);
                const pad = (n: number) => n.toString().padStart(2, '0');
                // Must use UTC methods: anchorDomain is in real UTC ms and the backend
                // queries in UTC. Local getters would shift the window by the timezone
                // offset, leaving a gap at the start of the chart.
                return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+00:00`;
            };

            const parseNominalTime = (ts: string) => {
                if (!ts) return 0;
                const clean = ts.replace(/(Z|[+-]\d{2}:\d{2})$/, "");
                const parts = clean.split("T");
                if (parts.length === 2) {
                    const [y, m, d] = parts[0].split("-").map(Number);
                    const [hr, min, sec] = parts[1].split(":").map(Number);
                    return new Date(y, m - 1, d, hr, min, sec).getTime();
                }
                return new Date(clean).getTime();
            };

            const [historyRes, forecastRes] = await Promise.all([
                weatherHistory(climateBarnId, undefined, toNominalUTC(anchorDomain[0]), toNominalUTC(anchorDomain[1]), 15), // 15min buckets
                weatherForecast(climateBarnId, undefined, toNominalUTC(anchorDomain[0]), toNominalUTC(anchorDomain[1]))
            ]);

            const unifiedHistory: any[] = [];
            let lastHistoryObs: any = null;

            // Process History
            if (historyRes?.data && historyRes.data.length > 0) {
                const historyData = [...historyRes.data];
                historyData.sort((a, b) => new Date(a.obs_time).getTime() - new Date(b.obs_time).getTime());
                
                historyData.forEach(obs => {
                    unifiedHistory.push({
                        time: parseNominalTime(obs.obs_time),
                        tempActual: obs.temperature,
                        humActual: obs.humidity,
                        thiActual: obs.thi,
                    });
                });
                
                lastHistoryObs = historyData[historyData.length - 1];
            }

            if (forecastRes?.forecast && forecastRes.forecast.length > 0) {
                const forecastData = forecastRes.forecast;
                
                if (lastHistoryObs) {
                    unifiedHistory.push({
                        time: parseNominalTime(lastHistoryObs.obs_time),
                        tempForecast: lastHistoryObs.temperature,
                        humForecast: lastHistoryObs.humidity,
                        thiForecast: lastHistoryObs.thi
                    });
                }

                forecastData.forEach((obs: any) => {
                    unifiedHistory.push({
                        time: parseNominalTime(obs.forecast_for || obs.time),
                        tempForecast: obs.temperature,
                        humForecast: obs.humidity,
                        thiForecast: obs.thi,
                    });
                });
            }

            unifiedHistory.sort((a, b) => a.time - b.time);

            // Limit data to strictly within the 24-hour anchor window
            const filteredHistory = unifiedHistory.filter(
                (item) => item.time >= anchorDomain[0] && item.time <= anchorDomain[1]
            );

            setClimateHistory(filteredHistory);
        } catch (error) {
            console.error("Chart history error:", error);
            setClimateHistory([]);
        } finally {
            setIsClimateLoading(false);
        }
    }, [climateBarnId, anchorDomain]);

    // Auto-fetch whenever barn changes
    useEffect(() => {
        fetchWeatherHistory();
    }, [fetchWeatherHistory]);

    return (
        <div className="w-full bg-white border-gray-200 border p-4 sm:p-5 rounded-[14px]">
            <CombinedClimateChart
                data={climateHistory}
                isLoading={isClimateLoading}
                domainMin={anchorDomain[0]}
                domainMax={anchorDomain[1]}
            />
        </div>
    );
};

export default ClimateSection;