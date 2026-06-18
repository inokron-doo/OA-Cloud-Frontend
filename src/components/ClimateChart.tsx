"use client";

import React, { useState, useEffect } from "react";
import type { ClimateChartProps } from "../interface/Climate"
import { useTranslation } from "react-i18next";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

import { MdKeyboardArrowDown } from "react-icons/md";
import { FiClock } from "react-icons/fi";
import SkeletonChart from "./SkeletonChart";



const ClimateChart: React.FC<ClimateChartProps> = ({ data, title, color, yDomain, isLoading, onOpen }) => {
    const { t } = useTranslation();

    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open && onOpen) {
            onOpen();
        }
    }, [open, onOpen]);

    const handleToggle = () => {
        setOpen(!open);
    };

    return (
        <div className="w-full">
            {/* Dropdown Header */}
            <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between text-[#364153] font-semibold text-base mb-2 tracking-tight focus:outline-none cursor-pointer"
            >
                <span>{title} (24h)</span>

                {/* Down Arrow */}
                <MdKeyboardArrowDown
                    className={`text-xl transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"
                        }`}
                />
            </button>

            {/* Sliding Chart Container */}
            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${open ? "max-h-125 opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="w-full pt-2">
                    {isLoading ? (
                        <div className="h-40">
                            <SkeletonChart height="140px" showTitle={false} />
                        </div>
                    ) : data && data.length > 0 ? (
                        <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={data}
                                    margin={{ top: 5, right: 5, left: -25, bottom: 20 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="2 2"
                                        vertical={true}
                                        stroke="#F0F0F0"
                                    />

                                    <XAxis
                                        dataKey="time"
                                        axisLine={{ stroke: "#666666", strokeWidth: 1 }}
                                        tickLine={true}
                                        tick={{ fontSize: 11, fill: "#666666" }}
                                        dy={5}
                                    />

                                    <YAxis
                                        domain={yDomain}
                                        axisLine={{ stroke: "#666666", strokeWidth: 1 }}
                                        tickLine={true}
                                        tick={{ fontSize: 11, fill: "#666666" }}
                                        dx={-5}
                                    />

                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length > 0) {
                                                const dataPoint = payload[0].payload;
                                                const val = payload[0].value;
                                                const formattedVal = typeof val === 'number' ? Number(val).toFixed(2) : val;
                                                const timeStr = dataPoint.displayDate ? `${dataPoint.displayDate}, ${label}` : label;

                                                return (
                                                    <div style={{
                                                        borderRadius: "12px",
                                                        border: "1px solid #E5E7EB",
                                                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                                        padding: "10px",
                                                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                                                        backdropFilter: "blur(4px)"
                                                    }}>
                                                        <p style={{ color: "#374151", fontWeight: 600, marginBottom: "4px", fontSize: "13px" }}>
                                                            {title}: {formattedVal}
                                                        </p>
                                                        <p style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>
                                                            Time: {timeStr}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />

                                    {/* Actual Data Line */}
                                    <Line
                                        name="actual"
                                        type="monotone"
                                        dataKey="actual"
                                        stroke={color}
                                        strokeWidth={2.5}
                                        dot={false}
                                        activeDot={{ r: 5, strokeWidth: 0, fill: color }}
                                        connectNulls
                                    />

                                    {/* Predicted Data Line */}
                                    <Line
                                        name="predicted"
                                        type="monotone"
                                        dataKey="predicted"
                                        stroke={color}
                                        strokeWidth={2.5}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        activeDot={{ r: 5, strokeWidth: 0, fill: color }}
                                        connectNulls
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                            <FiClock size={25} className="mb-2 opacity-50" />
                            <p className="text-sm">{t('dashboardPage.no_climate_data')}</p>
                        </div>
                    )}

                    {/* Legend */}
                    {data && data.length > 0 && !isLoading && (
                        <div className="flex items-center justify-center gap-6 mt-4 pb-2">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-0.5 rounded-full" style={{ backgroundColor: color }}></span>
                                <span className="text-xs font-medium text-gray-500">{t('dashboardPage.history')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-6 border-t-2 border-dashed" style={{ borderColor: color }}></span>
                                <span className="text-xs font-medium text-gray-500">{t('dashboardPage.forecast')}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClimateChart;