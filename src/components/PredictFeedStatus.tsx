// import { useState, useEffect } from "react";
// import { useTranslation } from "react-i18next";
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
// import { getFarms, getBarnsByFarm, getLocationByBarn } from "../api/barns";
// import { predictFeedLevel } from "../api/alert";
// import type { Farm, Barn, GetFeedingLocation } from "../interface/feedManagement";
// import { GoArrowRight } from "react-icons/go";
// import { FiClock } from "react-icons/fi";
// import SkeletonChart from "./SkeletonChart";

// const PredictFeedStatus = () => {
//     const { t } = useTranslation();

//     // Selectors state
//     const [farms, setFarms] = useState<Farm[]>([]);
//     const [farmId, setFarmId] = useState<string | null>(localStorage.getItem("selected_farm_id"));
//     const [barns, setBarns] = useState<Barn[]>([]);
//     const [barnId, setBarnId] = useState<string | null>(null);
//     const [locations, setLocations] = useState<GetFeedingLocation[]>([]);
//     const [locationId, setLocationId] = useState<string | null>(null);
//     const [horizonHours, setHorizonHours] = useState<number>(24);

//     // Loading states
//     const [isLoadingFarms, setIsLoadingFarms] = useState(false);
//     const [isLoadingBarns, setIsLoadingBarns] = useState(false);
//     const [isLoadingLocations, setIsLoadingLocations] = useState(false);
//     const [isPredicting, setIsPredicting] = useState(false);

//     // Prediction data
//     const [feedLevelStatus, setFeedLevelStatus] = useState<any>(null);

//     // 1. Initial Load: Fetch Farms
//     useEffect(() => {
//         const fetchFarms = async () => {
//             try {
//                 setIsLoadingFarms(true);
//                 const data = await getFarms();
//                 setFarms(data);
//             } catch (error) {
//                 console.error("Farms load error:", error);
//             } finally {
//                 setIsLoadingFarms(false);
//             }
//         };
//         fetchFarms();
//     }, []);

//     // 2. Fetch Barns when Farm changes
//     useEffect(() => {
//         const fetchBarns = async () => {
//             if (!farmId) {
//                 setBarns([]);
//                 return;
//             }
//             try {
//                 setIsLoadingBarns(true);
//                 const data = await getBarnsByFarm(farmId);
//                 const fetchedBarns = data.barns || [];
//                 setBarns(fetchedBarns);
//                 // No auto-select barnId
//             } catch (error) {
//                 console.error("Barns load error:", error);
//                 setBarns([]);
//             } finally {
//                 setIsLoadingBarns(false);
//             }
//         };
//         fetchBarns();
//     }, [farmId]);

//     // 3. Fetch Locations when Barn changes
//     useEffect(() => {
//         const fetchLocations = async () => {
//             if (!barnId) {
//                 setLocations([]);
//                 return;
//             }
//             try {
//                 setIsLoadingLocations(true);
//                 const data = await getLocationByBarn(barnId);
//                 const fetchedLocations = data.feeding_locations || [];
//                 setLocations(fetchedLocations);
//                 // No auto-select locationId
//             } catch (error) {
//                 console.error("Locations load error:", error);
//                 setLocations([]);
//             } finally {
//                 setIsLoadingLocations(false);
//             }
//         };
//         fetchLocations();
//     }, [barnId]);

//     // 4. Fetch Predictions when Barn, Location, or Horizon changes
//     useEffect(() => {
//         const fetchPredictions = async () => {
//             if (!barnId) return;

//             try {
//                 setIsPredicting(true);
//                 const params: any = {
//                     barn_id: barnId,
//                     horizon_hours: horizonHours
//                 };
//                 if (locationId) {
//                     params.feeding_location_id = locationId;
//                 }
//                 const data = await predictFeedLevel(params);
//                 setFeedLevelStatus(data);
//             } catch (error) {
//                 console.error("Error fetching feed level status:", error);
//                 setFeedLevelStatus(null);
//             } finally {
//                 setIsPredicting(false);
//             }
//         };
//         fetchPredictions();
//     }, [barnId, locationId, horizonHours]);

//     const handleFarmChange = (id: string) => {
//         setFarmId(id);
//         setBarnId(null);
//         setLocationId(null);
//         setFeedLevelStatus(null);
//     };

//     const handleBarnChange = (id: string) => {
//         setBarnId(id);
//         setLocationId(null);
//         setFeedLevelStatus(null);
//     };

//     const handleLocationChange = (id: string) => {
//         setLocationId(id);
//     };

//     const handleHorizonChange = (hours: number) => {
//         setHorizonHours(hours);
//     };

//     return (
//         <div className="w-full bg-white border-gray-200 border p-5 rounded-[14px] mt-5">
//             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
//                 <h2 className="text-[#364153] font-semibold text-base tracking-tight">{t("predictFeed.title")} ({horizonHours}h)</h2>

//                 {/* Selectors */}
//                 <div className="flex flex-wrap items-center gap-2">
//                     {/* Farm Select */}
//                     <select
//                         value={farmId || ""}
//                         onChange={(e) => handleFarmChange(e.target.value)}
//                         disabled={isLoadingFarms}
//                         className="px-3 py-1.5 text-sm text-[#101828] rounded-lg bg-[#F9FAFB] border border-[#D1D5DC] outline-none cursor-pointer disabled:opacity-50"
//                     >
//                         <option value="">{isLoadingFarms ? t("navbar.loading_farm") + "..." : t("navbar.select_Farm")}</option>
//                         {farms.map((farm) => (
//                             <option key={farm.farm_id} value={farm.farm_id}>{farm.name}</option>
//                         ))}
//                     </select>

//                     <span className="text-[#99A1AF] hidden sm:block"><GoArrowRight size={18} /></span>

//                     {/* Barn Select */}
//                     <select
//                         value={barnId || ""}
//                         onChange={(e) => handleBarnChange(e.target.value)}
//                         disabled={!farmId || isLoadingBarns}
//                         className="px-3 py-1.5 text-sm rounded-lg border border-[#D1D5DC] bg-[#F9FAFB] text-[#101828] outline-none cursor-pointer disabled:opacity-50"
//                     >
//                         <option value="">{isLoadingBarns ? t("navbar.loading_barn") + "..." : t("navbar.select_barn")}</option>
//                         {barns.map((b) => (
//                             <option key={b.barn_id} value={b.barn_id}>{b.barn_name}</option>
//                         ))}
//                     </select>

//                     <span className="text-[#99A1AF] hidden sm:block"><GoArrowRight size={18} /></span>

//                     {/* Location Select (Optional) */}
//                     <select
//                         value={locationId || ""}
//                         onChange={(e) => handleLocationChange(e.target.value)}
//                         disabled={!barnId || isLoadingLocations}
//                         className="px-3 py-1.5 text-sm rounded-lg border border-[#D1D5DC] bg-[#F9FAFB] text-[#101828] outline-none cursor-pointer disabled:opacity-50"
//                     >
//                         <option value="">{isLoadingLocations ? t("navbar.loading_location") || "Loading..." : t("navbar.select_location") || "Select Location"}</option>
//                         {locations.map((loc) => (
//                             <option key={loc.feeding_location_id} value={loc.feeding_location_id}>{loc.name}</option>
//                         ))}
//                     </select>

//                     <span className="text-[#99A1AF] hidden sm:block"><GoArrowRight size={18} /></span>

//                     {/* Horizon Select */}
//                     <select
//                         value={horizonHours}
//                         onChange={(e) => handleHorizonChange(Number(e.target.value))}
//                         className="px-3 py-1.5 text-sm rounded-lg border border-[#D1D5DC] bg-[#F9FAFB] text-[#101828] outline-none cursor-pointer"
//                     >
//                         <option value={1}>1h</option>
//                         <option value={6}>6h</option>
//                         <option value={12}>12h</option>
//                         <option value={24}>24h</option>
//                         <option value={48}>48h</option>
//                     </select>
//                 </div>
//             </div>

//             {feedLevelStatus && feedLevelStatus.predictions && feedLevelStatus.predictions.length > 0 ? (
//                 <>
//                     <div className="h-40 w-full relative">
//                         {isPredicting && (
//                             <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded">
//                                 <span className="text-sm text-gray-500 font-medium">{t("predictFeed.updating")}</span>
//                             </div>
//                         )}
//                         <ResponsiveContainer width="100%" height="100%">
//                             <LineChart
//                                 data={feedLevelStatus.predictions.map((p: any) => ({
//                                     time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//                                     displayDate: new Date(p.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
//                                     level: p.predicted_feed_level_percentage
//                                 }))}
//                                 margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
//                             >
//                                 <CartesianGrid
//                                     strokeDasharray="2 2"
//                                     vertical={true}
//                                     stroke="#F0F0F0"
//                                 />
//                                 <XAxis
//                                     dataKey="time"
//                                     axisLine={{ stroke: "#666666", strokeWidth: 1 }}
//                                     tickLine={true}
//                                     tick={{ fontSize: 11, fill: "#666666" }}
//                                     dy={5}
//                                 />
//                                 <YAxis
//                                     axisLine={{ stroke: "#666666", strokeWidth: 1 }}
//                                     tickLine={true}
//                                     tick={{ fontSize: 11, fill: "#666666" }}
//                                     dx={-5}
//                                     domain={[0, 100]}
//                                 />
//                                 <Tooltip
//                                     contentStyle={{
//                                         borderRadius: "12px",
//                                         border: "1px solid #E5E7EB",
//                                         boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
//                                         padding: "10px",
//                                         backgroundColor: "rgba(255, 255, 255, 0.95)",
//                                         backdropFilter: "blur(4px)"
//                                     }}
//                                     itemStyle={{ fontSize: "12px", fontWeight: 500 }}
//                                     labelStyle={{ color: "#374151", fontWeight: 600, marginBottom: "4px" }}
//                                     labelFormatter={(label, payload) => {
//                                         if (payload && payload.length > 0) {
//                                             const dataPoint = payload[0].payload;
//                                             return dataPoint.displayDate ? `${dataPoint.displayDate}, ${label}` : label;
//                                         }
//                                         return label;
//                                     }}
//                                     formatter={(value: any) => [typeof value === 'number' ? value.toFixed(2) + '%' : value + '%', t("predictFeed.tooltip_predicted")]}
//                                 />
//                                 <Line
//                                     name={t("predictFeed.tooltip_predicted")}
//                                     type="monotone"
//                                     dataKey="level"
//                                     stroke="#00A63E"
//                                     strokeWidth={2.5}
//                                     dot={false}
//                                     activeDot={{ r: 5, strokeWidth: 0, fill: "#00A63E" }}
//                                     connectNulls
//                                 />
//                             </LineChart>
//                         </ResponsiveContainer>
//                     </div>

//                     {/* Legend matched from ClimateChart.tsx */}
//                     <div className="flex items-center justify-center gap-6 mt-4 pb-2">
//                         <div className="flex items-center gap-2">
//                             <span className="w-6 h-0.5 rounded-full bg-[#00A63E]"></span>
//                             <span className="text-xs font-medium text-gray-500">{t("predictFeed.legend_predicted")}</span>
//                         </div>
//                     </div>
//                 </>
//             ) : (
//                 <div className="flex flex-col items-center justify-center h-40">
//                     {isPredicting ? (
//                         <SkeletonChart height="140px" showTitle={false} />
//                     ) : (
//                         <>
//                             <FiClock size={25} className="mb-2 opacity-50 text-gray-400" />
//                             <p className="text-sm font-medium text-center px-4 text-gray-400">
//                                 {!barnId
//                                     ? t("predictFeed.select_msg")
//                                     : t("predictFeed.no_data_msg")
//                                 }
//                             </p>
//                         </>
//                     )}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default PredictFeedStatus;


import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { predictFeedLevel } from "../api/alert";
import { useBarn } from "../context/BarnContext";
import { FiClock } from "react-icons/fi";
import SkeletonChart from "./SkeletonChart";

type FeedingEventMarker = {
    time: number;
    quantityKg: number | null;
};

const normalizeFeedingEvents = (payload: any): FeedingEventMarker[] => {
    const eventsFromHistory = Array.isArray(payload?.feeding_events) ? payload.feeding_events : [];
    const eventsFromResult = Array.isArray(payload?.result?.applied_refills) ? payload.result.applied_refills : [];

    const normalized = [
        ...eventsFromHistory.map((event: any) => {
            const timestamp = event?.start_datetime || event?.timestamp || event?.time;
            const quantity = event?.feeding_activity?.quantity_kg ?? event?.quantity_kg ?? event?.quantityKg ?? null;
            return {
                time: new Date(timestamp).getTime(),
                quantityKg: typeof quantity === 'number' ? quantity : null,
            };
        }),
        ...eventsFromResult.map((event: any) => {
            const timestamp = event?.time || event?.timestamp || event?.start_datetime;
            const quantity = event?.quantity_kg ?? event?.quantityKg ?? event?.feeding_activity?.quantity_kg ?? null;
            return {
                time: new Date(timestamp).getTime(),
                quantityKg: typeof quantity === 'number' ? quantity : null,
            };
        }),
    ].filter((event) => Number.isFinite(event.time));

    const deduped = new Map<number, FeedingEventMarker>();
    normalized.forEach((event) => {
        if (!deduped.has(event.time)) {
            deduped.set(event.time, event);
        }
    });

    return Array.from(deduped.values()).sort((a, b) => a.time - b.time);
};

const PredictFeedStatus = () => {
    const { t } = useTranslation();

    const { selectedBarn } = useBarn();
    const barnId = selectedBarn?.barn_id || null;

    const [horizonHours, setHorizonHours] = useState<number>(parseInt(localStorage.getItem("predict_horizon") || "24"));

    // Loading states
    const [isPredicting, setIsPredicting] = useState(false);

    // Prediction data
    const [feedLevelStatus, setFeedLevelStatus] = useState<any>(null);

    // --- 2. Fetching Chain Reactions ---

    // C. Fetch Predictions when Barn or Horizon changes
    useEffect(() => {
        const fetchPredictions = async () => {
            if (!barnId) {
                setFeedLevelStatus(null);
                return;
            }

            try {
                setIsPredicting(true);
                const params: any = {
                    barn_id: barnId,
                    horizon_hours: horizonHours
                };
                const data = await predictFeedLevel(params);
                setFeedLevelStatus(data);
            } catch (error) {
                console.error("Error fetching predictions:", error);
                setFeedLevelStatus(null);
            } finally {
                setIsPredicting(false);
            }
        };
        fetchPredictions();
    }, [barnId, horizonHours]);

    // --- 3. Handlers with Storage Persistence ---

    const handleHorizonChange = (hours: number) => {
        setHorizonHours(hours);
        localStorage.setItem("predict_horizon", hours.toString());
    };

    const forecastPoints = (() => {
        if (!feedLevelStatus) return [];
        if (feedLevelStatus.result?.forecast) {
            const points = feedLevelStatus.result.forecast.map((p: any) => ({
                timestamp: p.time,
                level: p.level_percent
            }));
            if (feedLevelStatus.result.current_level_percent !== undefined && feedLevelStatus.result.current_time) {
                return [
                    {
                        timestamp: feedLevelStatus.result.current_time,
                        level: feedLevelStatus.result.current_level_percent
                    },
                    ...points
                ];
            }
            return points;
        }
        if (feedLevelStatus.predictions) {
            return feedLevelStatus.predictions.map((p: any) => ({
                timestamp: p.timestamp,
                level: p.predicted_feed_level_percentage ?? p.predicted_level ?? p.feed_level ?? 0
            }));
        }
        return [];
    })();

    const timezone = feedLevelStatus?.result?.timezone;
    const feedingEventMarkers = normalizeFeedingEvents(feedLevelStatus);

    const formatTime = (timestamp: any) => {
        try {
            const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
            if (timezone) options.timeZone = timezone;
            return new Date(timestamp).toLocaleTimeString([], options);
        } catch (e) {
            return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };

    const formatDate = (timestamp: any) => {
        try {
            const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
            if (timezone) options.timeZone = timezone;
            return new Date(timestamp).toLocaleDateString([], options);
        } catch (e) {
            return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    return (
        <div className="w-full bg-white border-gray-200 border p-5 rounded-[14px] mt-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-[#364153] font-semibold text-base tracking-tight">
                    {t("predictFeed.title")} ({horizonHours}h)
                </h2>

                {/* Selectors */}
                <div className="flex flex-wrap items-center gap-2">

                    {/* Horizon Select */}
                    <select
                        value={horizonHours}
                        onChange={(e) => handleHorizonChange(Number(e.target.value))}
                        className="px-3 py-1.5 text-sm rounded-lg border border-[#D1D5DC] bg-[#F9FAFB] text-[#101828] outline-none cursor-pointer"
                    >
                        {[1, 6, 12, 24, 48].map(h => (
                            <option key={h} value={h}>{h}h</option>
                        ))}
                    </select>
                </div>
            </div>

            {forecastPoints.length > 0 ? (
                <>
                    <div className="h-40 w-full relative">
                        {isPredicting && (
                            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded">
                                <span className="text-sm text-gray-500 font-medium">{t("predictFeed.updating")}</span>
                            </div>
                        )}
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={forecastPoints.map((p: any) => ({
                                    time: new Date(p.timestamp).getTime(),
                                    displayDate: formatDate(p.timestamp),
                                    level: p.level
                                }))}
                                margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="2 2" vertical stroke="#F0F0F0" />
                                <XAxis
                                    dataKey="time"
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    tickFormatter={(tick) => formatTime(tick)}
                                    tick={{ fontSize: 11, fill: "#666" }}
                                    axisLine={{ stroke: "#666" }}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{ fontSize: 11, fill: "#666" }}
                                    axisLine={{ stroke: "#666" }}
                                />
                                <Tooltip
                                    labelFormatter={(label, payload) => {
                                        if (payload?.[0]) {
                                            const dp = payload[0].payload;
                                            return `${dp.displayDate}, ${formatTime(label)}`;
                                        }
                                        return label;
                                    }}
                                    formatter={(v: any) => [`${Number(v).toFixed(2)}%`, t("predictFeed.tooltip_predicted")]}
                                />
                                {feedingEventMarkers.map((refill: FeedingEventMarker, idx: number) => {
                                    const refillTime = refill.time;
                                    const minTime = forecastPoints.length > 0 ? new Date(forecastPoints[0].timestamp).getTime() : 0;
                                    const maxTime = forecastPoints.length > 0 ? new Date(forecastPoints[forecastPoints.length - 1].timestamp).getTime() : 0;
                                    if (refillTime < minTime || refillTime > maxTime) return null;
                                    return (
                                        <ReferenceLine
                                            key={`refill-${idx}`}
                                            x={refillTime}
                                            stroke="#10b981"
                                            strokeDasharray="3 3"
                                            strokeWidth={1.5}
                                            label={{
                                                value: refill.quantityKg !== null ? `+${Math.round(refill.quantityKg)}kg` : 'Feeding',
                                                position: "insideTopLeft",
                                                fill: "#047857",
                                                fontSize: 10,
                                                fontWeight: "bold",
                                            }}
                                        />
                                    );
                                })}
                                <Line
                                    type="monotone"
                                    dataKey="level"
                                    stroke="#00A63E"
                                    strokeWidth={2.5}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex items-center justify-center gap-6 mt-4 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-0.5 rounded-full bg-[#00A63E]"></span>
                            <span className="text-xs font-medium text-gray-500">{t("predictFeed.legend_predicted")}</span>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-40">
                    {isPredicting ? (
                        <SkeletonChart height="140px" showTitle={false} />
                    ) : (
                        <>
                            <FiClock size={25} className="mb-2 opacity-50 text-gray-400" />
                            <p className="text-sm font-medium text-center px-4 text-gray-400">
                                {!barnId ? t("predictFeed.select_msg") : t("predictFeed.no_data_msg")}
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default PredictFeedStatus;
