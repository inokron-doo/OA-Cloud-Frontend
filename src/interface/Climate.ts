
import React from "react";

// Climate Gauge Interface
export interface ClimateGaugeProps {
    title: string;
    value: string | number;
    unit?: string;
    icon: React.ElementType;
    bgColor?: string;
    borderColor?: string;
    textColor?: string;
    iconColor?: string;
}

export interface ClimateChartProps {
    data: any[];
    title: string;
    color: string;
    yDomain: any;
    isLoading?: boolean;
    onOpen?: () => void;
}