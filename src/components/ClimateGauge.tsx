import type { ClimateGaugeProps } from "../interface/Climate"


const ClimateGauge: React.FC<ClimateGaugeProps> = ({
    title,
    value,
    unit,
    icon: Icon,
    bgColor,
    borderColor,
    textColor,
    iconColor,
}) => {
    return (
        <div
            className={`w-full rounded-xl border p-3 flex items-center justify-between ${bgColor} ${borderColor}`}
        >
            <div className="flex items-center gap-2.5">
                <Icon className={`${iconColor}`} size={18} />
                <h4 className="text-[#4A5565] font-normal text-sm sm:text-[15px]">{title}</h4>
            </div>

            <p className={`text-base font-semibold ${textColor}`}>
                {value}
                {unit && <span className="text-sm ml-0.5 font-normal opacity-80">{unit}</span>}
            </p>
        </div>
    );
};

export default ClimateGauge;
