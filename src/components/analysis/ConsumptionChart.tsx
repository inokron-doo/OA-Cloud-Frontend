// Consumption-rate panel: signed feed-level change per time block (%/hour).
// Positive bars = level rising (refills), negative bars = level falling (consumption).

import {
    BarChart, Bar, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";

export interface ConsumptionPoint {
    label: string;
    rate: number;
}

interface ConsumptionChartProps {
    data: ConsumptionPoint[];
    unit: string;
    emptyText: string;
}

const UP = "#12B76A";
const DOWN = "#F04438";

function ConsumptionChart({ data, unit, emptyText }: ConsumptionChartProps) {
    if (!data.length) {
        return (
            <div className="h-40 flex items-center justify-center text-[13px] text-[#98A2B3] border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                {emptyText}
            </div>
        );
    }

    return (
        <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#F0F0F0" />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "#666" }}
                        axisLine={{ stroke: "#666" }}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: "#666" }}
                        axisLine={{ stroke: "#666" }}
                        unit={unit}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        formatter={(v) => [`${v} ${unit}`, ""]}
                    />
                    <ReferenceLine y={0} stroke="#98A2B3" strokeWidth={1} />
                    <Bar dataKey="rate" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                        {data.map((d, i) => (
                            <Cell key={i} fill={d.rate >= 0 ? UP : DOWN} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default ConsumptionChart;
