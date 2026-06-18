import React from "react";

interface SkeletonChartProps {
    height?: string;
    title?: string;
    barsCount?: number;
    showTitle?: boolean;
}

const SkeletonChart: React.FC<SkeletonChartProps> = ({
    height = "160px",
    title,
    showTitle = true,
}) => {
    return (
        <div className="w-full bg-white rounded-[10px] p-4 animate-pulse border border-gray-100">
            {/* Header / Title Placeholder */}
            {showTitle && (
                <div className="flex justify-between items-center mb-6">
                    <div className="h-5 bg-gray-200 rounded w-1/3">
                        {title && <span className="invisible">{title}</span>}
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-6"></div> {/* Placeholder for arrow/icon */}
                </div>
            )}

            {/* Chart Area Placeholder */}
            <div className="flex items-end justify-between gap-2" style={{ height }}>
                {/* Y-Axis Placeholder */}
                <div className="flex flex-col justify-between h-full pr-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-2 bg-gray-100 rounded w-4"></div>
                    ))}
                </div>

                {/* Line Chart Placeholder */}
                <div className="flex-1 h-full relative">
                    {/* Grid Lines Placeholder */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-full border-t border-gray-100/50"></div>
                        ))}
                    </div>

                    {/* Modern Smooth Line Skeleton with Gradient Area */}
                    <div className="absolute inset-0 z-10 w-full h-full overflow-hidden">
                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <defs>
                                <linearGradient id="skeleton-gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#F3F4F6" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="#F3F4F6" stopOpacity="0.1" />
                                </linearGradient>
                            </defs>
                            {/* Smooth Area */}
                            <path
                                d="M0,70 C20,70 30,40 50,45 C70,50 80,20 100,25 L100,100 L0,100 Z"
                                fill="url(#skeleton-gradient)"
                                className="opacity-60"
                            />
                            {/* Smooth Line */}
                            <path
                                d="M0,70 C20,70 30,40 50,45 C70,50 80,20 100,25"
                                fill="none"
                                stroke="#E5E7EB"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* X-Axis Placeholder */}
            <div className="flex justify-between mt-3 ml-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-2 bg-gray-100 rounded w-6"></div>
                ))}
            </div>
        </div>
    );
};

export default SkeletonChart;
