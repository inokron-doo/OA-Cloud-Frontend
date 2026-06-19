import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts";
import { FiClock } from "react-icons/fi";
import SkeletonChart from "./SkeletonChart";

interface CombinedClimateChartProps {
    data: any[];
    isLoading: boolean;
    domainMin?: number;
    domainMax?: number;
}

const CombinedClimateChart: React.FC<CombinedClimateChartProps> = ({ data, isLoading, domainMin, domainMax }) => {
    const { t } = useTranslation();

    const nowMs = useMemo(() => {
        const now = new Date();
        return now.getTime() + now.getTimezoneOffset() * 60000;
    }, []);

    const formatTime = (timestamp: any) => {
        try {
            return new Date(timestamp).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        } catch {
            return new Date(timestamp).toLocaleTimeString();
        }
    };

    if (isLoading) {
        return (
            <div className="w-full h-80 pt-2 border border-gray-200 rounded-lg p-4">
                <SkeletonChart height="300px" showTitle={false} />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 border border-gray-200 rounded-[14px]">
                <FiClock size={30} className="mb-2 opacity-50" />
                <p className="text-sm">{t('dashboardPage.no_climate_data') || "No Climate Data Available"}</p>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col h-[360px] overflow-hidden relative">
            <h1 className="text-gray-900 text-base font-bold mb-3">Climate History & Predictions</h1>
            <div className="w-full flex-1 relative border border-gray-200 rounded-lg overflow-hidden">
                {/* Mobile: fixed wider width + horizontal scroll; sm+: fills the card. */}
                <div className="h-full w-full overflow-x-auto">
                <div className="h-full min-w-[600px] sm:min-w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical stroke="#F0F0F0" />
                        
                        {(() => {
                            const xTicks = [];
                            if (domainMin && domainMax) {
                                for (let t = domainMin; t <= domainMax; t += 4 * 3600 * 1000) {
                                    xTicks.push(t);
                                }
                            }
                            return (
                                <XAxis
                                    dataKey="time"
                                    type="number"
                                    domain={[domainMin ?? 'dataMin', domainMax ?? 'dataMax']}
                                    ticks={xTicks.length > 0 ? xTicks : undefined}
                                    tickFormatter={(t) => formatTime(t)}
                                    tick={{ fill: "#666", fontSize: 11 }}
                                />
                            );
                        })()}
                        
                        <YAxis
                            yAxisId="left"
                            domain={['auto', 'auto']}
                            tick={{ fontSize: 11, fill: "#EA580C", fontWeight: 'bold' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={['auto', 'auto']}
                            tick={{ fontSize: 11, fill: "#2563EB", fontWeight: 'bold' }}
                            axisLine={false}
                            tickLine={false}
                        />

                        {/* Background Areas Removed */}

                        {/* Current Time */}
                        <ReferenceLine
                            x={nowMs}
                            stroke="#ef4444"
                            strokeWidth={1.5}
                            yAxisId="left"
                            label={{
                                value: "NOW",
                                position: "insideTopRight",
                                fill: "#ef4444",
                                fontSize: 12,
                                fontWeight: "bold",
                                offset: 10,
                            }}
                        />

                        <Tooltip
                            contentStyle={{
                                borderRadius: "12px",
                                border: "1px solid #E5E7EB",
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                padding: "10px",
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                backdropFilter: "blur(4px)"
                            }}
                            itemStyle={{ fontSize: "12px", fontWeight: 500 }}
                            labelStyle={{ color: "#374151", fontWeight: 600, marginBottom: "4px" }}
                            labelFormatter={(label) => formatTime(label)}
                            formatter={(value: any, name: string | undefined) => {
                                const safeName = name || "";
                                let label = "";
                                let unit = "";
                                if (safeName.includes("temp")) { label = "Temperature"; unit = "°C"; }
                                if (safeName.includes("hum")) { label = "Humidity"; unit = "%"; }
                                if (safeName.includes("thi")) { label = "THI"; }
                                
                                const status = safeName.includes("Actual") ? " (Actual)" : " (Forecast)";
                                return [`${Math.round(value * 10) / 10}${unit}`, label + status];
                            }}
                        />

                        {/* Historical (Solid) */}
                        <Line yAxisId="left" type="monotone" dataKey="tempActual" stroke="#EA580C" strokeWidth={2.5} dot={false} connectNulls />
                        <Line yAxisId="right" type="monotone" dataKey="humActual" stroke="#2563EB" strokeWidth={2.5} dot={false} connectNulls />
                        <Line yAxisId="right" type="monotone" dataKey="thiActual" stroke="#9333EA" strokeWidth={2.5} dot={false} connectNulls />

                        {/* Forecast (Dashed) */}
                        <Line yAxisId="left" type="monotone" dataKey="tempForecast" stroke="#EA580C" strokeWidth={2.5} strokeDasharray="5 5" dot={false} connectNulls />
                        <Line yAxisId="right" type="monotone" dataKey="humForecast" stroke="#2563EB" strokeWidth={2.5} strokeDasharray="5 5" dot={false} connectNulls />
                        <Line yAxisId="right" type="monotone" dataKey="thiForecast" stroke="#9333EA" strokeWidth={2.5} strokeDasharray="5 5" dot={false} connectNulls />

                    </ComposedChart>
                </ResponsiveContainer>
                </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-3">
                <div className="flex items-center gap-2">
                    <span className="w-4 h-1 rounded-full bg-[#EA580C]"></span>
                    <span className="text-xs font-medium text-gray-500">Temp (°C)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-1 rounded-full bg-[#2563EB]"></span>
                    <span className="text-xs font-medium text-gray-500">Humidity (%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-1 rounded-full bg-[#9333EA]"></span>
                    <span className="text-xs font-medium text-gray-500">THI</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <span className="w-4 border-t-2 border-dashed border-gray-500"></span>
                    <span className="text-xs font-medium text-gray-500">Forecast</span>
                </div>
            </div>
        </div>
    );
};

export default CombinedClimateChart;
