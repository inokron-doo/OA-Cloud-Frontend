// Summary stat cards shown above the analysis chart.
// Each card reports avg / min / max for a series over the active (brushed) range.

export interface StatCard {
    label: string;
    color: string;
    unit?: string;
    min: number | null;
    max: number | null;
    avg: number | null;
}

interface AnalysisStatsProps {
    cards: StatCard[];
    labels: {
        min: string;
        max: string;
        avg: string;
    };
}

const fmt = (v: number | null, unit?: string) =>
    v == null || Number.isNaN(v) ? "—" : `${v.toFixed(1)}${unit ? ` ${unit}` : ""}`;

function AnalysisStats({ cards, labels }: AnalysisStatsProps) {
    if (!cards.length) return null;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {cards.map((c) => (
                <div
                    key={c.label}
                    className="border border-[#E5E7EB] rounded-xl p-4 bg-white"
                >
                    <div className="flex items-center gap-1.5 min-w-0 mb-2">
                        <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                        />
                        <span className="text-[12px] font-medium text-[#667085] truncate">
                            {c.label}
                        </span>
                    </div>

                    <div className="text-[22px] font-semibold text-[#101828] leading-tight">
                        {fmt(c.avg, c.unit)}
                    </div>
                    <div className="text-[11px] text-[#98A2B3] mt-0.5">{labels.avg}</div>

                    <div className="mt-2 flex items-center gap-3 text-[11px] text-[#98A2B3]">
                        <span>
                            {labels.min} <span className="text-[#475467]">{fmt(c.min)}</span>
                        </span>
                        <span>
                            {labels.max} <span className="text-[#475467]">{fmt(c.max)}</span>
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default AnalysisStats;
