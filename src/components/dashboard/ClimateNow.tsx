import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiThermometer } from "react-icons/fi";
import { LuDroplets, LuGauge } from "react-icons/lu";

import { currentWeather } from "../../api/barns";
import { useBarn } from "../../context/BarnContext";

type ClimateType = "temperature" | "humidity" | "thi";

/**
 * Compact "current conditions" strip for the selected barn. Mirrors the
 * at-a-glance feed-level cards at the top of the dashboard; the climate
 * history + forecast chart lives lower down in ClimateSection.
 */
const ClimateNow = () => {
    const { t } = useTranslation();
    const { selectedBarn: activeBarn } = useBarn();

    const [weatherData, setWeatherData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchLiveWeather = async () => {
            if (!activeBarn || activeBarn.latitude === undefined || activeBarn.longitude === undefined) {
                setWeatherData(null);
                return;
            }
            try {
                setIsLoading(true);
                const response = await currentWeather(activeBarn.latitude, activeBarn.longitude);
                setWeatherData(response);
            } catch (error) {
                console.error("Weather Fetch Error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLiveWeather();
    }, [activeBarn]);

    const iconMap: Record<ClimateType, any> = { temperature: FiThermometer, humidity: LuDroplets, thi: LuGauge };
    const styleMap: Record<ClimateType, any> = {
        temperature: { bg: "bg-[#FFF7ED]", border: "border-[#FFD6A7]", text: "text-[#7E2A0C]", iconColor: "text-[#F54900]" },
        humidity: { bg: "bg-[#EFF6FF]", border: "border-[#BEDBFF]", text: "text-[#1C398E]", iconColor: "text-[#155DFC]" },
        thi: { bg: "bg-[#FAF5FF]", border: "border-[#E9D4FF]", text: "text-[#59168B]", iconColor: "text-[#9810FA]" },
    };

    // Nothing to anchor to (no barn / no coordinates) → render nothing.
    if (!activeBarn || activeBarn.latitude === undefined || activeBarn.longitude === undefined) {
        return null;
    }

    return (
        // 3-up on every breakpoint. Mobile: compact vertical cards (icon / value /
        // label). Desktop: slim horizontal rows (icon + label … value) so they read
        // as a stat bar instead of three oversized tiles.
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {(["temperature", "humidity", "thi"] as ClimateType[]).map((type) => {
                const Icon = iconMap[type];
                const s = styleMap[type];
                const value = isLoading ? "..." : (weatherData?.[type] ?? 0);
                const unit = type === "temperature" ? "°C" : type === "humidity" ? "%" : "";
                const label = t(`dashboardPage.cli_${type === "temperature" ? "temp" : type === "humidity" ? "hum" : "thi"}`);
                return (
                    <div
                        key={type}
                        className={`rounded-xl border p-3 sm:py-2.5 flex flex-col items-center text-center gap-1 sm:flex-row sm:items-center sm:text-left sm:gap-2.5 ${s.bg} ${s.border}`}
                    >
                        <Icon className={`order-1 ${s.iconColor}`} size={20} />
                        <span className="order-3 sm:order-2 text-[11px] sm:text-sm text-[#4A5565] truncate max-w-full">{label}</span>
                        <p className={`order-2 sm:order-3 sm:ml-auto text-lg sm:text-base font-semibold leading-tight whitespace-nowrap ${s.text}`}>
                            {value}
                            {unit && <span className="text-xs ml-0.5 font-normal opacity-80">{unit}</span>}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};

export default ClimateNow;
